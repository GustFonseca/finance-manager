import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { HELP_SEEN_KEY, HelpProvider, HelpRegistry, HelpTopic, hasSeenHelp, markHelpSeen } from '../help';
import { Window } from '../Window';
import { useWindowManager, WindowIdProvider } from '../WindowManager';
import { pointerDown, pointerMove, pointerUp, setViewport } from './helpers';

type Api = ReturnType<typeof useWindowManager>;

let wm: Api;

function Probe() {
  wm = useWindowManager();
  return null;
}

function frameOf(title: string) {
  let node: HTMLElement | null = screen.getByText(title);
  while (node && !node.style.zIndex) node = node.parentElement;
  return node as HTMLElement;
}

function titleBarOf(title: string) {
  return screen.getByText(title).parentElement as HTMLElement;
}

async function flush() {
  await act(async () => {});
}

function renderWindow(props: Partial<React.ComponentProps<typeof Window>> = {}) {
  return renderWithProviders(
    <>
      <Probe />
      <Window title="Transações" icon="exchange" {...props}>
        <span>conteúdo</span>
      </Window>
    </>,
    { windowId: '/transactions' }
  );
}

describe('Window', () => {
  let now = 1_000_000;

  beforeEach(() => {
    setViewport(1200, 800);
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the title, content, toolbar actions and status bar', async () => {
    const onAction = jest.fn();
    const onRefresh = jest.fn();
    renderWindow({ actions: [{ label: 'Nova', icon: 'plus', onPress: onAction }], onRefresh, status: '3 itens' });
    await flush();

    expect(screen.getByText('conteúdo')).toBeTruthy();
    expect(screen.getByText('3 itens')).toBeTruthy();
    fireEvent.click(screen.getByText('Nova'));
    expect(onAction).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Atualizar'));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const frame = frameOf('Transações');
    expect(frame.style.left).toBe('114px');
    expect(frame.style.top).toBe('49px');
    expect(frame.style.width).toBe('860px');
    expect(wm.metaOf('/transactions')).toEqual({ title: 'Transações', icon: 'exchange' });
  });

  it('omits the toolbar and status bar when there is nothing to show', async () => {
    renderWindow();
    await flush();
    expect(screen.queryAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Minimizar',
      'Maximizar',
      'Fechar',
    ]);
    fireEvent.click(screen.getByText('Arquivo'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Fechar']);
  });

  it('does not render when the window is not open', async () => {
    renderWithProviders(
      <WindowIdProvider value="/accounts">
        <Window title="Contas" icon="bank">
          <span>contas</span>
        </Window>
      </WindowIdProvider>,
      { windowId: '/transactions' }
    );
    await flush();
    expect(screen.queryByText('contas')).toBeNull();
  });

  it('runs the actions and closes from the Arquivo menu', async () => {
    const onAction = jest.fn();
    renderWindow({ actions: [{ label: 'Nova', icon: 'plus', onPress: onAction }] });
    await flush();

    fireEvent.click(screen.getByText('Arquivo'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nova...' }));
    expect(onAction).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Arquivo'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fechar' }));
    expect(screen.queryByText('conteúdo')).toBeNull();
    expect(wm.isOpen('/transactions')).toBe(false);
  });

  it('maximizes, restores and minimizes from the Exibir menu', async () => {
    const onRefresh = jest.fn();
    renderWindow({ onRefresh });
    await flush();

    fireEvent.click(screen.getByText('Exibir'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Atualizar' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Exibir'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Maximizar' }));
    expect(wm.isMaximized('/transactions')).toBe(true);
    expect(frameOf('Transações').style.left).toBe('');
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeTruthy();

    fireEvent.click(screen.getByText('Exibir'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Restaurar' }));
    expect(wm.isMaximized('/transactions')).toBe(false);

    fireEvent.click(screen.getByText('Exibir'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Minimizar' }));
    expect(frameOf('Transações').style.display).toBe('none');
    expect(wm.isMinimized('/transactions')).toBe(true);
  });

  it('keeps the content mounted while minimized and unmounts it when closed', async () => {
    const mounts = { count: 0, unmounts: 0 };
    function Stateful() {
      const [value, setValue] = React.useState(0);
      React.useEffect(() => {
        mounts.count += 1;
        return () => {
          mounts.unmounts += 1;
        };
      }, []);
      return <button onClick={() => setValue(value + 1)}>{`cliques ${value}`}</button>;
    }
    renderWithProviders(
      <>
        <Probe />
        <Window title="Transações" icon="exchange">
          <Stateful />
        </Window>
      </>,
      { windowId: '/transactions' }
    );
    await flush();
    fireEvent.click(screen.getByText('cliques 0'));

    act(() => wm.minimize('/transactions'));
    expect(frameOf('Transações').style.display).toBe('none');
    expect(screen.queryByRole('button', { name: 'cliques 1' })).toBeNull();

    act(() => wm.open('/transactions'));
    expect(frameOf('Transações').style.display).not.toBe('none');
    expect(screen.getByRole('button', { name: 'cliques 1' })).toBeTruthy();
    expect(mounts).toEqual({ count: 1, unmounts: 0 });

    act(() => wm.close('/transactions'));
    expect(screen.queryByText('cliques 1')).toBeNull();
    expect(mounts).toEqual({ count: 1, unmounts: 1 });
  });

  it('shows the about dialog from the Ajuda menu', async () => {
    renderWindow();
    await flush();
    fireEvent.click(screen.getByText('Ajuda'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sobre o Finance Manager' }));
    expect(await screen.findByText(/Controle de receitas, despesas, contas e metas/)).toBeTruthy();
  });

  it('uses the caption buttons to minimize, maximize and close', async () => {
    renderWindow();
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Maximizar' }));
    expect(wm.isMaximized('/transactions')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(wm.isMaximized('/transactions')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Minimizar' }));
    expect(wm.isMinimized('/transactions')).toBe(true);

    act(() => wm.open('/transactions'));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(wm.isOpen('/transactions')).toBe(false);
  });

  it('drags the window by the title bar and remembers the position', async () => {
    renderWindow();
    await flush();

    pointerDown(titleBarOf('Transações'), { clientX: 200, clientY: 100 });
    expect(document.body.style.userSelect).toBe('none');
    pointerMove({ clientX: 250, clientY: 130 });
    expect(frameOf('Transações').style.left).toBe('164px');
    expect(frameOf('Transações').style.top).toBe('79px');
    pointerUp();

    expect(document.body.style.userSelect).toBe('');
    expect(wm.positionOf('/transactions')).toEqual({ x: 164, y: 79 });
    pointerMove({ clientX: 900, clientY: 900 });
    expect(frameOf('Transações').style.left).toBe('164px');
  });

  it('keeps the window reachable when dragged off screen', async () => {
    renderWindow();
    await flush();

    pointerDown(titleBarOf('Transações'), { clientX: 200, clientY: 100 });
    pointerMove({ clientX: -5000, clientY: -5000 });
    expect(frameOf('Transações').style.left).toBe('-760px');
    expect(frameOf('Transações').style.top).toBe('0px');
    pointerMove({ clientX: 5000, clientY: 5000 });
    expect(frameOf('Transações').style.left).toBe('1100px');
    expect(frameOf('Transações').style.top).toBe('742px');
    pointerUp('pointercancel');
    expect(wm.positionOf('/transactions')).toEqual({ x: 1100, y: 742 });
  });

  it('resizes from the corner, remembers the size and shows the grip', async () => {
    renderWindow({ status: 'ok' });
    await flush();
    const frame = frameOf('Transações');
    const width = parseInt(frame.style.width, 10);
    const height = parseInt(frame.style.height, 10);

    expect(screen.getByLabelText('Redimensionar')).toBeTruthy();
    pointerDown(screen.getByTestId('resize-se'), { clientX: 500, clientY: 500 });
    expect(document.body.style.userSelect).toBe('none');
    pointerMove({ clientX: 540, clientY: 470 });
    expect(frameOf('Transações').style.width).toBe(`${width + 40}px`);
    expect(frameOf('Transações').style.height).toBe(`${height - 30}px`);
    pointerUp();

    expect(document.body.style.userSelect).toBe('');
    expect(wm.sizeOf('/transactions')).toEqual({ width: width + 40, height: height - 30 });
    pointerMove({ clientX: 900, clientY: 900 });
    expect(frameOf('Transações').style.width).toBe(`${width + 40}px`);
  });

  it('pulls the left edge, moving the window, and ignores other buttons', async () => {
    renderWindow();
    await flush();
    const left = parseInt(frameOf('Transações').style.left, 10);

    pointerDown(screen.getByTestId('resize-w'), { clientX: 300, clientY: 300, button: 2 });
    pointerMove({ clientX: 200, clientY: 300 });
    expect(frameOf('Transações').style.left).toBe(`${left}px`);

    pointerDown(screen.getByTestId('resize-w'), { clientX: 300, clientY: 300 });
    pointerMove({ clientX: 250, clientY: 300 });
    pointerUp('pointercancel');

    expect(wm.positionOf('/transactions')?.x).toBe(left - 50);
  });

  it('uses a remembered size limited to the screen and hides the handles when maximized', async () => {
    renderWindow({ status: 'ok' });
    await flush();
    act(() => wm.setSize('/transactions', { width: 5000, height: 5000 }));

    expect(frameOf('Transações').style.width).toBe('1200px');
    act(() => wm.toggleMaximize('/transactions'));

    expect(screen.queryByTestId('resize-se')).toBeNull();
    expect(screen.queryByLabelText('Redimensionar')).toBeNull();
  });

  it('toggles maximize on a title bar double click', async () => {
    renderWindow();
    await flush();
    const bar = titleBarOf('Transações');

    pointerDown(bar, { clientX: 10, clientY: 10 });
    pointerUp();
    now += 100;
    pointerDown(bar, { clientX: 10, clientY: 10 });
    expect(wm.isMaximized('/transactions')).toBe(true);

    now += 1000;
    pointerDown(titleBarOf('Transações'), { clientX: 10, clientY: 10 });
    pointerMove({ clientX: 60, clientY: 60 });
    expect(frameOf('Transações').style.left).toBe('');
    now += 100;
    pointerDown(titleBarOf('Transações'), { clientX: 10, clientY: 10 });
    expect(wm.isMaximized('/transactions')).toBe(false);
  });

  it('ignores non primary buttons and presses on the caption buttons', async () => {
    renderWindow();
    await flush();

    pointerDown(titleBarOf('Transações'), { button: 2, clientX: 0, clientY: 0 });
    pointerMove({ clientX: 100, clientY: 100 });
    expect(frameOf('Transações').style.left).toBe('114px');

    pointerDown(screen.getByRole('button', { name: 'Fechar' }), { clientX: 0, clientY: 0 });
    pointerMove({ clientX: 100, clientY: 100 });
    expect(frameOf('Transações').style.left).toBe('114px');
    expect(document.body.style.userSelect).toBe('');
  });

  it('brings an inactive window to the front when pressed', async () => {
    renderWithProviders(
      <>
        <Probe />
        <Window title="Transações" icon="exchange">
          <span>t</span>
        </Window>
        <WindowIdProvider value="/accounts">
          <Window title="Contas" icon="bank">
            <span>c</span>
          </Window>
        </WindowIdProvider>
      </>,
      { windowId: '/transactions' }
    );
    await flush();

    act(() => wm.open('/accounts'));
    expect(wm.activeWindow).toBe('/accounts');
    expect(router.navigate).toHaveBeenCalledWith('/accounts');
    expect(frameOf('Contas').style.left).toBe('142px');
    expect(frameOf('Contas').style.zIndex).toBe('2');
    expect(frameOf('Transações').style.zIndex).toBe('1');

    pointerDown(frameOf('Contas'));
    expect(wm.activeWindow).toBe('/accounts');

    pointerDown(frameOf('Transações'));
    expect(wm.activeWindow).toBe('/transactions');
    expect(frameOf('Transações').style.zIndex).toBe('2');
  });

  describe('help', () => {
    const topic: HelpTopic = {
      title: 'Transações',
      icon: 'exchange',
      summary: 'resumo',
      howItWorks: ['funciona'],
      steps: [{ title: 'passo', text: 'texto' }],
    };

    function present(shown: HelpTopic, onClose: () => void) {
      return (
        <div>
          <span>tutorial {shown.title}</span>
          <button onClick={onClose}>fechar tutorial</button>
        </div>
      );
    }

    function renderHelpWindow(topics: HelpRegistry = { '/transactions': topic }) {
      return renderWithProviders(
        <HelpProvider topics={topics} present={present}>
          <Probe />
          <Window title="Transações" icon="exchange">
            <span>conteúdo</span>
          </Window>
        </HelpProvider>,
        { windowId: '/transactions' }
      );
    }

    it('opens the tutorial the first time and marks it seen when closed', async () => {
      renderHelpWindow();
      await flush();
      expect(screen.getByText('tutorial Transações')).toBeTruthy();
      expect(hasSeenHelp('/transactions')).toBe(false);

      fireEvent.click(screen.getByText('fechar tutorial'));
      expect(screen.queryByText('tutorial Transações')).toBeNull();
      expect(hasSeenHelp('/transactions')).toBe(true);
    });

    it('does not open the tutorial again once seen', async () => {
      localStorage.setItem(HELP_SEEN_KEY, JSON.stringify(['/transactions']));
      renderHelpWindow();
      await flush();
      expect(screen.queryByText('tutorial Transações')).toBeNull();
    });

    it('reopens the tutorial from the toolbar, the Ajuda menu and the caption button', async () => {
      markHelpSeen('/transactions');
      renderHelpWindow();
      await flush();

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        'Como funciona',
        'Minimizar',
        'Maximizar',
        'Fechar',
        null,
      ]);
      expect(screen.getByTestId('icon-question-circle')).toBeTruthy();

      fireEvent.click(screen.getByText('Como funciona'));
      expect(screen.getByText('tutorial Transações')).toBeTruthy();
      fireEvent.click(screen.getByText('fechar tutorial'));
      expect(screen.queryByText('tutorial Transações')).toBeNull();

      fireEvent.click(screen.getByText('Ajuda'));
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'Como funciona esta janela',
        'Sobre o Finance Manager',
      ]);
      fireEvent.click(screen.getByRole('menuitem', { name: 'Como funciona esta janela' }));
      expect(screen.getByText('tutorial Transações')).toBeTruthy();
      fireEvent.click(screen.getByText('fechar tutorial'));

      fireEvent.click(screen.getByText('?'));
      expect(screen.getByText('tutorial Transações')).toBeTruthy();
      fireEvent.click(screen.getByText('fechar tutorial'));
      expect(JSON.parse(localStorage.getItem(HELP_SEEN_KEY) as string)).toEqual(['/transactions']);
    });

    it('shows no help controls when the window has no topic', async () => {
      renderHelpWindow({ '/accounts': topic });
      await flush();
      expect(screen.queryByText('tutorial Transações')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Como funciona' })).toBeNull();
      expect(screen.queryByText('Como funciona')).toBeNull();
      fireEvent.click(screen.getByText('Ajuda'));
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Sobre o Finance Manager']);
    });
  });

  it('is always maximized on a compact screen', async () => {
    setViewport(600, 800);
    renderWindow();
    await flush();

    expect(screen.queryByRole('button', { name: 'Maximizar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull();
    expect(frameOf('Transações').style.left).toBe('');

    fireEvent.click(screen.getByText('Exibir'));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Minimizar']);
    fireEvent.click(screen.getByText('Exibir'));

    const bar = titleBarOf('Transações');
    pointerDown(bar, { clientX: 10, clientY: 10 });
    now += 100;
    pointerDown(bar, { clientX: 10, clientY: 10 });
    expect(wm.isMaximized('/transactions')).toBe(false);
  });
});

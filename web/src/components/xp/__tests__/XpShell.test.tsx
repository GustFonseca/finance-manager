import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { useAuth } from '@/features/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { renderWithProviders } from '@/test/render';
import { playClick } from '../sound/clickSound';
import { Window } from '../Window';
import { useWindowManager } from '../WindowManager';
import { XpShell } from '../XpShell';
import { hover, setViewport, unhover } from './helpers';

jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn() } }));
jest.mock('../sound/clickSound', () => ({ playClick: jest.fn() }));

const signOut = jest.fn();

let wm: ReturnType<typeof useWindowManager>;

function Probe() {
  wm = useWindowManager();
  return null;
}

function GoalsScreen() {
  return (
    <Window title="Minhas metas" icon="bullseye">
      <span>metas</span>
    </Window>
  );
}

function AccountsScreen() {
  return (
    <Window title="Contas" icon="bank">
      <span>contas</span>
    </Window>
  );
}

async function renderShell(pathname = '/unknown') {
  const utils = renderWithProviders(
    <XpShell screens={{ '/goals': GoalsScreen, '/accounts': AccountsScreen }} desktopExtras={<span>extras</span>}>
      <Probe />
    </XpShell>,
    { windowId: pathname }
  );
  await screen.findByRole('button', { name: 'Abrir Painel' });
  return utils;
}

function startButton() {
  return screen.getByRole('button', { name: 'Iniciar' });
}

function taskButtons() {
  return screen
    .queryAllByRole('button')
    .filter((button) => !button.hasAttribute('aria-label'))
    .map((button) => button.textContent);
}

function taskButton(label: string) {
  return screen.getAllByRole('button').find((b) => !b.hasAttribute('aria-label') && b.textContent === label) as HTMLElement;
}

describe('XpShell', () => {
  beforeEach(() => {
    setViewport(1200, 800);
    jest.mocked(useAuth).mockReturnValue({ user: { name: 'gustavo' }, signOut } as unknown as ReturnType<typeof useAuth>);
  });

  it('renders the desktop, extras and the taskbar', async () => {
    await renderShell();
    expect(screen.getByText('extras')).toBeTruthy();
    expect(screen.getByText('iniciar')).toBeTruthy();
    expect(taskButtons()).toEqual([]);
  });

  it('opens and closes the start menu', async () => {
    await renderShell();
    fireEvent.click(startButton());
    expect(screen.getByText('gustavo')).toBeTruthy();
    expect(screen.getByText('G')).toBeTruthy();
    expect(screen.getByText('Receitas e despesas')).toBeTruthy();

    fireEvent.click(startButton());
    expect(screen.queryByText('gustavo')).toBeNull();

    fireEvent.click(startButton());
    fireEvent.click(screen.getByLabelText('Fechar menu Iniciar'));
    expect(screen.queryByText('gustavo')).toBeNull();
  });

  it('limits the start menu to the screen width', async () => {
    setViewport(300, 800);
    await renderShell();
    fireEvent.click(startButton());
    const menu = screen.getByText('gustavo').parentElement?.parentElement as HTMLElement;
    expect(menu.style.width).toBe('300px');
  });

  it('shows placeholders when the user is unknown', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: null, signOut } as unknown as ReturnType<typeof useAuth>);
    await renderShell();
    fireEvent.click(startButton());
    expect(screen.getByText('Usuário')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('opens programs from the start menu and lists them on the taskbar', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Objetivos de economia'));
    expect(screen.queryByText('Objetivos de economia')).toBeNull();
    expect(screen.getByText('metas')).toBeTruthy();
    expect(taskButtons()).toEqual(['Minhas metas']);
    expect(wm.activeWindow).toBe('/goals');

    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Contas e saldos'));
    expect(taskButtons()).toEqual(['Minhas metas', 'Contas']);
    expect(wm.activeWindow).toBe('/accounts');
  });

  it('minimizes and restores windows from the taskbar', async () => {
    await renderShell('/goals');
    expect(taskButtons()).toEqual(['Minhas metas']);

    fireEvent.click(taskButton('Minhas metas'));
    expect(screen.queryByText('metas')).toBeNull();
    expect(taskButtons()).toEqual(['Minhas metas']);
    expect(wm.activeWindow).toBeUndefined();

    fireEvent.click(taskButton('Minhas metas'));
    expect(screen.getByText('metas')).toBeTruthy();
  });

  it('uses the program title for windows without a screen and skips unknown windows', async () => {
    await renderShell('/savings');
    act(() => wm.open('dialog:unknown'));
    expect(taskButtons()).toEqual(['Plano de economia']);
    expect(wm.activeWindow).toBe('dialog:unknown');
  });

  it('refreshes the data from the start menu', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Atualizar dados'));
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
    expect(screen.queryByText('gustavo')).toBeNull();
  });

  it('shows the help dialog', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Ajuda e suporte'));
    expect(await screen.findByText(/Abra os programas pelo menu Iniciar/)).toBeTruthy();
  });

  it('logs off', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Fazer logoff'));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('shuts down after confirmation', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Desligar'));
    const message = await screen.findByText('Deseja encerrar a sessão e sair do Finance Manager?');
    expect(message).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: 'Desligar' });
    await act(async () => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('stays logged in when the shut down is cancelled', async () => {
    await renderShell();
    fireEvent.click(startButton());
    fireEvent.click(screen.getByText('Desligar'));
    await screen.findByText('Deseja encerrar a sessão e sair do Finance Manager?');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('highlights the taskbar and start menu items on hover', async () => {
    await renderShell('/goals');
    act(() => wm.open('/accounts'));

    hover(startButton());
    unhover(startButton());
    for (const label of ['Minhas metas', 'Contas']) {
      hover(taskButton(label));
      unhover(taskButton(label));
    }

    fireEvent.click(startButton());
    hover(startButton());
    for (const text of ['Contas e saldos', 'Atualizar dados', 'Fazer logoff']) {
      const item = screen.getByText(text).closest('[tabindex="0"]') as HTMLElement;
      hover(item);
      expect(screen.getByText(text)).toBeTruthy();
      unhover(item);
    }
    expect(screen.getByText('gustavo')).toBeTruthy();
  });

  describe('volume', () => {
    function volumeButton() {
      return screen.getByRole('button', { name: /^Volume:/ });
    }

    function volumeIcon() {
      return within(volumeButton()).getByTestId(/^icon-volume/).getAttribute('data-icon');
    }

    it('changes and persists the volume', async () => {
      await renderShell();
      expect(volumeButton().getAttribute('aria-label')).toBe('Volume: 60%');
      expect(volumeIcon()).toBe('volume-up');

      fireEvent.click(volumeButton());
      const slider = screen.getByLabelText('Volume') as HTMLInputElement;
      expect(slider.value).toBe('60');

      fireEvent.change(slider, { target: { value: '30' } });
      expect(volumeButton().getAttribute('aria-label')).toBe('Volume: 30%');
      expect(volumeIcon()).toBe('volume-down');
      await act(async () => {});
      expect(JSON.parse(localStorage.getItem('xp_sound') as string)).toEqual({ volume: 30, muted: false });

      jest.mocked(playClick).mockClear();
      fireEvent.pointerUp(slider);
      expect(playClick).toHaveBeenCalledWith((0.3 ** 2) * 0.8);
      fireEvent.keyUp(slider, { key: 'ArrowUp' });
      expect(playClick).toHaveBeenCalledTimes(2);

      fireEvent.change(slider, { target: { value: '0' } });
      expect(volumeIcon()).toBe('volume-off');

      fireEvent.click(screen.getByLabelText('Fechar volume'));
      expect(screen.queryByLabelText('Volume')).toBeNull();
    });

    it('mutes the sound', async () => {
      await renderShell();
      fireEvent.click(volumeButton());
      fireEvent.click(screen.getByRole('checkbox'));
      expect(volumeButton().getAttribute('aria-label')).toBe('Volume: sem áudio');
      expect(volumeIcon()).toBe('volume-off');
      await act(async () => {});
      expect(JSON.parse(localStorage.getItem('xp_sound') as string)).toEqual({ volume: 60, muted: true });

      fireEvent.click(volumeButton());
      expect(screen.queryByRole('checkbox')).toBeNull();
    });
  });
});

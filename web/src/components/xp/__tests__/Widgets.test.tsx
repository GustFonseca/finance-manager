import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { reportError } from '@/lib/logger';
import { Clock } from '../Clock';
import { CrashDialog } from '../CrashDialog';
import { MenuBar } from '../MenuBar';
import { findProgram, PROGRAMS, visiblePrograms } from '../programs';
import { TitleBar } from '../TitleBar';
import { Toolbar } from '../Toolbar';
import { RetroMark } from '../RetroMark';
import * as xp from '../index';
import { hover, unhover } from './helpers';

jest.mock('@/lib/logger', () => ({ reportError: jest.fn() }));

describe('Clock', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the current time and keeps it updated', () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 18, 9, 5, 0) });
    const { unmount } = render(<Clock />);
    const clock = screen.getByText('09:05');
    expect(clock.getAttribute('aria-label')).toBe(new Date(2026, 9, 18, 9, 5, 0).toLocaleString('pt-BR'));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('09:06')).toBeTruthy();
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('programs', () => {
  it('finds programs by route', () => {
    expect(findProgram('/goals')?.title).toBe('Metas');
    expect(findProgram('/nope')).toBeUndefined();
    expect(new Set(PROGRAMS.map((program) => program.route)).size).toBe(PROGRAMS.length);
  });

  it('shows the admin only programs to admins only', () => {
    expect(findProgram('/rules')).toMatchObject({ title: 'Regras de classificação', adminOnly: true });
    expect(visiblePrograms(false).map((program) => program.route)).not.toContain('/rules');
    expect(visiblePrograms(false)).toHaveLength(PROGRAMS.length - 1);
    expect(visiblePrograms(true)).toEqual(PROGRAMS);
  });

  it('is re-exported from the package entry', () => {
    expect(xp.PROGRAMS).toBe(PROGRAMS);
    expect(typeof xp.useVisiblePrograms).toBe('function');
    expect(typeof xp.XpShell).toBe('function');
  });
});

describe('RetroMark', () => {
  it('draws a computer on a tile sized to the mark', () => {
    const { container } = render(<RetroMark size={30} />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.style.width).toBe('30px');
    expect(tile.style.height).toBe('30px');
    expect(screen.getByTestId('icon-desktop')).toBeTruthy();
  });

  it('defaults to 18 pixels', () => {
    const { container } = render(<RetroMark />);
    expect((container.firstElementChild as HTMLElement).style.width).toBe('18px');
  });
});

describe('TitleBar', () => {
  it('renders only the title when there are no actions', () => {
    render(<TitleBar title="Sozinho" />);
    expect(screen.getByText('Sozinho')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByTestId(/^icon-/)).toBeNull();
  });

  it('renders the caption buttons and reacts to hover and press', () => {
    const onMinimize = jest.fn();
    const onMaximize = jest.fn();
    const onClose = jest.fn();
    const { rerender } = render(
      <TitleBar title="Janela" icon="bank" active={false} onMinimize={onMinimize} onMaximize={onMaximize} onClose={onClose} draggable />
    );
    expect(screen.getByTestId('icon-bank')).toBeTruthy();
    for (const name of ['Minimizar', 'Maximizar', 'Fechar']) {
      const button = screen.getByRole('button', { name });
      hover(button);
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      fireEvent.click(button);
      unhover(button);
    }
    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onMaximize).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<TitleBar title="Janela" maximized onMaximize={onMaximize} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(onMaximize).toHaveBeenCalledTimes(2);
  });

  it('renders the help caption button before the others', () => {
    const onHelp = jest.fn();
    render(<TitleBar title="Janela" onHelp={onHelp} onClose={jest.fn()} />);
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Como funciona', 'Fechar']);
    const help = screen.getByRole('button', { name: 'Como funciona' });
    expect(help.textContent).toBe('?');
    fireEvent.click(help);
    expect(onHelp).toHaveBeenCalledTimes(1);
  });
});

describe('Toolbar', () => {
  it('renders buttons with their labels', () => {
    const onPress = jest.fn();
    render(
      <Toolbar
        buttons={[
          { label: 'Nova', icon: 'plus', onPress },
          { label: 'Excluir', icon: 'trash', color: '#f00', onPress },
        ]}
      />
    );
    const button = screen.getByRole('button', { name: 'Nova' });
    hover(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });
      fireEvent.click(button);
    unhover(button);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});

describe('MenuBar', () => {
  const open = jest.fn();
  const save = jest.fn();
  const menus = [
    {
      label: 'Arquivo',
      entries: [
        { label: 'Abrir', bold: true, onPress: open },
        'separator' as const,
        { label: 'Salvar', disabled: true, onPress: save },
      ],
    },
    { label: 'Editar', entries: [{ label: 'Copiar', onPress: jest.fn() }] },
  ];

  function menuItems() {
    return screen.queryAllByRole('menuitem').map((item) => item.textContent);
  }

  it('opens, switches on hover and closes menus', () => {
    const { container } = render(<MenuBar menus={menus} />);
    expect(menuItems()).toEqual([]);

    hover(screen.getByText('Editar').parentElement as HTMLElement);
    expect(menuItems()).toEqual([]);
    unhover(screen.getByText('Editar').parentElement as HTMLElement);

    fireEvent.click(screen.getByText('Arquivo'));
    expect(menuItems()).toEqual(['Abrir', 'Salvar']);

    hover(screen.getByText('Editar').parentElement as HTMLElement);
    expect(menuItems()).toEqual(['Copiar']);

    fireEvent.click(screen.getByText('Editar'));
    expect(menuItems()).toEqual([]);

    fireEvent.click(screen.getByText('Arquivo'));
    fireEvent.click((container.firstElementChild as HTMLElement).firstElementChild as HTMLElement);
    expect(menuItems()).toEqual([]);
  });

  it('runs enabled entries and ignores disabled ones', () => {
    render(<MenuBar menus={menus} />);
    fireEvent.click(screen.getByText('Arquivo'));

    const disabled = screen.getByRole('menuitem', { name: 'Salvar' });
    hover(disabled);
    fireEvent.click(disabled);
    expect(save).not.toHaveBeenCalled();

    const item = screen.getByRole('menuitem', { name: 'Abrir' });
    hover(item);
    fireEvent.click(item);
    expect(open).toHaveBeenCalledTimes(1);
    expect(menuItems()).toEqual([]);
  });
});

describe('CrashDialog', () => {
  const error = new TypeError('x is undefined');

  it('reports the error and toggles the details', () => {
    render(<CrashDialog error={error} retry={jest.fn()} />);
    expect(reportError).toHaveBeenCalledWith(error);
    expect(screen.getByText('O Finance Manager encontrou um problema e precisa ser fechado.')).toBeTruthy();
    expect(screen.queryByText('TypeError: x is undefined')).toBeNull();

    fireEvent.click(screen.getByText('Clique aqui para ver os detalhes do erro.'));
    expect(screen.getByText('TypeError: x is undefined')).toBeTruthy();

    fireEvent.click(screen.getByText('Ocultar detalhes'));
    expect(screen.queryByText('TypeError: x is undefined')).toBeNull();
  });

  it('retries', () => {
    const retry = jest.fn();
    render(<CrashDialog error={error} retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('reloads the page', () => {
    const original = window.location;
    const reload = jest.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });
    try {
      render(<CrashDialog error={error} retry={jest.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Recarregar página' }));
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});

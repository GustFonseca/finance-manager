import React from 'react';
import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react';
import { profileApi } from '@/features/profile/api';
import { queryClient } from '@/lib/queryClient';
import { renderWithProviders } from '@/test/render';
import { useContextMenu } from '../ContextMenu';
import { Desktop } from '../Desktop';
import { useDesktop, useDesktopMenu } from '../DesktopContext';
import { DesktopIcon } from '../DesktopIcon';
import { Window } from '../Window';
import { useWindowManager } from '../WindowManager';
import { pointerDown, pointerMove, pointerUp, setViewport } from './helpers';

jest.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn() } }));
jest.mock('@/features/profile/api');

const STORAGE_KEY = 'xp_desktop_icons';

let desktop: ReturnType<typeof useDesktop>;
let wm: ReturnType<typeof useWindowManager>;

function Probe() {
  desktop = useDesktop();
  wm = useWindowManager();
  return null;
}

function TransactionsScreen() {
  return (
    <Window title="Janela de transações" icon="exchange">
      <span>lista de transações</span>
    </Window>
  );
}

const screens = { '/transactions': TransactionsScreen };

function FileIcon({ onRename, onOpen = jest.fn(), withMenu = true }: { onRename?: (name: string) => void; onOpen?: () => void; withMenu?: boolean }) {
  const { startRename } = useDesktop();
  return (
    <DesktopIcon
      id="file:1"
      label="Extrato"
      icon="file"
      color="#000"
      slot="bottom-right"
      onOpen={onOpen}
      onRename={onRename}
      menu={withMenu ? () => [{ label: 'Renomear', onPress: () => startRename('file:1') }] : undefined}
    />
  );
}

function MenuExtras({ entries }: { entries: { label: string; onPress: () => void }[] }) {
  useDesktopMenu(() => entries);
  return null;
}

async function renderDesktop(children: React.ReactNode = null, windowId = '/unknown') {
  const utils = renderWithProviders(
    <Desktop screens={screens} extras={<span>extra</span>}>
      <Probe />
      {children}
    </Desktop>,
    { windowId }
  );
  await screen.findByRole('button', { name: 'Abrir Painel' });
  return utils;
}

function iconStyle(label: string) {
  const el = screen.getByRole('button', { name: `Abrir ${label}` });
  return { left: el.style.left, top: el.style.top };
}

function storedPositions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
}

function wallpaper() {
  return screen.getByText('extra').parentElement as HTMLElement;
}

describe('Desktop', () => {
  let now = 1_000_000;

  beforeEach(() => {
    setViewport(1200, 800);
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.mocked(profileApi.get).mockResolvedValue({ email: 'g@x.com', name: 'Gustavo', isAdmin: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lays out one icon per program in columns', async () => {
    await renderDesktop(<FileIcon />);
    expect(iconStyle('Painel')).toEqual({ left: '8px', top: '8px' });
    expect(iconStyle('Transações')).toEqual({ left: '8px', top: '88px' });
    expect(iconStyle('Gastos evitáveis')).toEqual({ left: '8px', top: '568px' });
    expect(iconStyle('Plano de economia')).toEqual({ left: '8px', top: '648px' });
    expect(iconStyle('Desafios')).toEqual({ left: '92px', top: '8px' });
    expect(iconStyle('Visualizar eventos')).toEqual({ left: '92px', top: '88px' });
    expect(iconStyle('Lista de espera')).toEqual({ left: '92px', top: '168px' });
    expect(iconStyle('Dívidas')).toEqual({ left: '92px', top: '248px' });
    expect(iconStyle('Planejamento')).toEqual({ left: '92px', top: '328px' });
    expect(iconStyle('Imposto de Renda')).toEqual({ left: '92px', top: '408px' });
    expect(iconStyle('Calendário')).toEqual({ left: '92px', top: '488px' });
    expect(iconStyle('Extrato')).toEqual({ left: '1108px', top: '682px' });
    expect(screen.getByText('extra')).toBeTruthy();
    await waitFor(() => expect(profileApi.get).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Abrir Regras de classificação' })).toBeNull();
  });

  it('shows the admin only programs to admins', async () => {
    jest.mocked(profileApi.get).mockResolvedValue({ email: 'g@x.com', name: 'Gustavo', isAdmin: true });
    await renderDesktop();
    expect(await screen.findByRole('button', { name: 'Abrir Regras de classificação' })).toBeTruthy();
    expect(iconStyle('Regras de classificação')).toEqual({ left: '92px', top: '568px' });
  });

  it('hides the admin only programs while the profile is unknown', async () => {
    jest.mocked(profileApi.get).mockRejectedValue(new Error('offline'));
    await renderDesktop();
    await waitFor(() => expect(profileApi.get).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Abrir Regras de classificação' })).toBeNull();
  });

  it('wraps icons into a new column when the screen is short', async () => {
    setViewport(1200, 300);
    await renderDesktop();
    expect(iconStyle('Painel')).toEqual({ left: '8px', top: '8px' });
    expect(iconStyle('Transações')).toEqual({ left: '8px', top: '88px' });
    expect(iconStyle('Contas')).toEqual({ left: '8px', top: '168px' });
    expect(iconStyle('Metas')).toEqual({ left: '92px', top: '8px' });
  });

  it('uses a single row when the screen is tiny', async () => {
    setViewport(1200, 60);
    await renderDesktop();
    expect(iconStyle('Transações')).toEqual({ left: '92px', top: '8px' });
  });

  it('opens a program on double click', async () => {
    await renderDesktop();
    const icon = screen.getByRole('button', { name: 'Abrir Transações' });

    pointerDown(icon, { clientX: 10, clientY: 10 });
    expect(desktop.selectedIcon).toBe('program:/transactions');
    pointerUp();
    expect(screen.queryByText('lista de transações')).toBeNull();

    now += 1000;
    pointerDown(icon, { clientX: 10, clientY: 10 });
    pointerUp();
    expect(screen.queryByText('lista de transações')).toBeNull();

    now += 100;
    pointerDown(icon, { clientX: 10, clientY: 10 });
    pointerUp();
    expect(screen.getByText('lista de transações')).toBeTruthy();
    expect(wm.activeWindow).toBe('/transactions');

    now += 100;
    pointerDown(icon, { clientX: 10, clientY: 10 });
    pointerUp();
    expect(wm.openWindows).toEqual(['/transactions']);
  });

  it('skips open windows that have no screen', async () => {
    await renderDesktop(null, '/');
    expect(wm.openWindows).toEqual(['/']);
    expect(screen.queryByText('lista de transações')).toBeNull();
  });

  it('ignores secondary button presses on icons', async () => {
    await renderDesktop();
    pointerDown(screen.getByRole('button', { name: 'Abrir Contas' }), { button: 2 });
    expect(desktop.selectedIcon).toBeNull();
  });

  it('drags icons, clamps them and persists the positions', async () => {
    await renderDesktop();
    const icon = screen.getByRole('button', { name: 'Abrir Painel' });

    pointerDown(icon, { clientX: 20, clientY: 20 });
    expect(document.body.style.userSelect).toBe('none');
    pointerMove({ clientX: 22, clientY: 21 });
    expect(iconStyle('Painel')).toEqual({ left: '8px', top: '8px' });
    pointerMove({ clientX: 120, clientY: 220 });
    expect(iconStyle('Painel')).toEqual({ left: '108px', top: '208px' });
    pointerMove({ clientX: 121, clientY: 221 });
    expect(iconStyle('Painel')).toEqual({ left: '109px', top: '209px' });
    pointerUp();

    expect(document.body.style.userSelect).toBe('');
    expect(iconStyle('Painel')).toEqual({ left: '109px', top: '209px' });
    expect(storedPositions()).toEqual({ 'program:/': { x: 109, y: 209 } });

    pointerDown(icon, { clientX: 0, clientY: 0 });
    pointerMove({ clientX: -9999, clientY: -9999 });
    expect(iconStyle('Painel')).toEqual({ left: '0px', top: '0px' });
    pointerMove({ clientX: 9999, clientY: 9999 });
    expect(iconStyle('Painel')).toEqual({ left: '1116px', top: '690px' });
    pointerUp('pointercancel');
    expect(storedPositions()).toEqual({ 'program:/': { x: 1116, y: 690 } });
    expect(screen.queryByText('lista de transações')).toBeNull();
  });

  it('restores saved positions and clamps them to the screen', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'program:/': { x: 300, y: 5000 } }));
    await renderDesktop();
    expect(iconStyle('Painel')).toEqual({ left: '300px', top: '690px' });
  });

  it('falls back to the default layout when the saved positions are corrupt', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    await renderDesktop();
    expect(iconStyle('Painel')).toEqual({ left: '8px', top: '8px' });
    expect(storedPositions()).toEqual({});
  });

  it('clears the selection when the background is pressed', async () => {
    await renderDesktop();
    pointerDown(screen.getByRole('button', { name: 'Abrir Metas' }));
    pointerUp();
    expect(desktop.selectedIcon).toBe('program:/goals');
    pointerDown(wallpaper());
    expect(desktop.selectedIcon).toBeNull();
  });

  it('shows the desktop context menu and arranges the icons', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'program:/': { x: 300, y: 300 } }));
    await renderDesktop();
    expect(iconStyle('Painel')).toEqual({ left: '300px', top: '300px' });

    fireEvent.contextMenu(wallpaper(), { clientX: 50, clientY: 60 });
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Organizar ícones',
      'Atualizar',
    ]);
    const panel = screen.getByRole('menu');
    expect(panel.style.left).toBe('50px');
    expect(panel.style.top).toBe('60px');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Organizar ícones' }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(iconStyle('Painel')).toEqual({ left: '8px', top: '8px' });

    fireEvent.contextMenu(wallpaper(), { clientX: 50, clientY: 60 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Atualizar' }));
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('adds the entries registered by the open program to the desktop menu', async () => {
    const onPress = jest.fn();
    const { rerender } = await renderDesktop(<MenuExtras entries={[{ label: 'Importar extrato', onPress }]} />);

    fireEvent.contextMenu(wallpaper(), { clientX: 1150, clientY: 790 });
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Organizar ícones',
      'Atualizar',
      'Importar extrato',
    ]);
    const panel = screen.getByRole('menu');
    expect(panel.style.left).toBe('970px');
    expect(panel.style.top).toBe('714px');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Importar extrato' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(
      <Desktop screens={screens}>
        <Probe />
      </Desktop>
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Abrir Painel' }).parentElement as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('keeps the context menu on screen near the top left corner', async () => {
    setViewport(150, 20);
    await renderDesktop();
    fireEvent.contextMenu(wallpaper(), { clientX: 10, clientY: 10 });
    const panel = screen.getByRole('menu');
    expect(panel.style.left).toBe('0px');
    expect(panel.style.top).toBe('0px');
  });

  it('dismisses the context menu by clicking or right clicking outside', async () => {
    await renderDesktop();
    fireEvent.contextMenu(wallpaper(), { clientX: 50, clientY: 60 });
    fireEvent.click(screen.getByLabelText('Fechar menu'));
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.contextMenu(wallpaper(), { clientX: 50, clientY: 60 });
    fireEvent.contextMenu(screen.getByLabelText('Fechar menu'), { clientX: 1, clientY: 1 });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('does not show the desktop menu when right clicking inside a window', async () => {
    await renderDesktop(null, '/transactions');
    fireEvent.contextMenu(screen.getByText('lista de transações'), { clientX: 50, clientY: 60 });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens a program from the icon context menu', async () => {
    await renderDesktop();
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Abrir Transações' }), { clientX: 30, clientY: 30 });
    expect(desktop.selectedIcon).toBe('program:/transactions');
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Abrir']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Abrir' }));
    expect(screen.getByText('lista de transações')).toBeTruthy();
  });

  describe('rename', () => {
    function input() {
      return screen.getByDisplayValue('Extrato') as HTMLInputElement;
    }

    async function startRename(onRename = jest.fn()) {
      await renderDesktop(<FileIcon onRename={onRename} />);
      fireEvent.contextMenu(screen.getByRole('button', { name: 'Abrir Extrato' }), { clientX: 30, clientY: 30 });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Renomear' }));
      expect(desktop.renamingIcon).toBe('file:1');
      expect(desktop.selectedIcon).toBe('file:1');
      return onRename;
    }

    it('saves the new name on Enter', async () => {
      const onRename = await startRename();
      const field = input();
      fireEvent.change(field, { target: { value: '  Fatura  ' } });
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(onRename).toHaveBeenCalledWith('Fatura');
      expect(onRename).toHaveBeenCalledTimes(1);
      expect(desktop.renamingIcon).toBeNull();
      expect(screen.getByText('Extrato')).toBeTruthy();
    });

    it('saves on blur once', async () => {
      const onRename = await startRename();
      fireEvent.change(input(), { target: { value: 'Fatura' } });
      const field = screen.getByDisplayValue('Fatura');
      fireEvent.blur(field);
      fireEvent.blur(field);
      expect(onRename).toHaveBeenCalledTimes(1);
    });

    it('does not rename when the name is unchanged or empty', async () => {
      const onRename = await startRename();
      const field = input();
      fireEvent.change(field, { target: { value: '   ' } });
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(onRename).not.toHaveBeenCalled();
      expect(desktop.renamingIcon).toBeNull();
    });

    it('keeps the name when unchanged', async () => {
      const onRename = await startRename();
      fireEvent.keyDown(input(), { key: 'Enter' });
      expect(onRename).not.toHaveBeenCalled();
    });

    it('cancels on Escape', async () => {
      const onRename = await startRename();
      fireEvent.change(input(), { target: { value: 'Fatura' } });
      const field = screen.getByDisplayValue('Fatura');
      fireEvent.keyDown(field, { key: 'a' });
      fireEvent.keyDown(field, { key: 'Escape' });
      expect(onRename).not.toHaveBeenCalled();
      expect(desktop.renamingIcon).toBeNull();
    });

    it('finishes only once when Escape is followed by a blur', async () => {
      const onRename = await startRename();
      const field = input();
      fireEvent.change(field, { target: { value: 'Fatura' } });
      act(() => {
        fireEvent.keyDown(field, { key: 'Escape' });
        fireEvent.blur(field);
      });
      expect(onRename).not.toHaveBeenCalled();
      expect(desktop.renamingIcon).toBeNull();
    });

    it('ignores presses on the icon while renaming', async () => {
      await startRename();
      act(() => desktop.selectIcon(null));
      pointerDown(screen.getByRole('button', { name: 'Abrir Extrato' }));
      expect(desktop.selectedIcon).toBeNull();
    });

    it('does not show the input for icons that cannot be renamed', async () => {
      await renderDesktop(<FileIcon />);
      act(() => desktop.startRename('file:1'));
      expect(screen.queryByDisplayValue('Extrato')).toBeNull();
      expect(screen.getByText('Extrato')).toBeTruthy();
      act(() => desktop.stopRename());
      expect(desktop.renamingIcon).toBeNull();
    });
  });

  it('opens the default menu of an icon without a custom menu', async () => {
    const onOpen = jest.fn();
    await renderDesktop(<FileIcon onOpen={onOpen} withMenu={false} />);
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Abrir Extrato' }), { clientX: 30, clientY: 30 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Abrir' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('requires its providers', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useDesktop())).toThrow('useDesktop must be used within a DesktopProvider');
    expect(() => renderHook(() => useContextMenu())).toThrow('useContextMenu must be used within a ContextMenuProvider');
  });
});

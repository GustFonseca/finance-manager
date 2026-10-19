import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { setViewport } from '@/components/xp/__tests__/helpers';
import { profileApi } from '@/features/profile/api';
import { profile } from '@/features/profile/__tests__/fixtures';
import { renderWithProviders } from '@/test/render';
import { useDesktop, useWindowManager } from '@/components/xp';
import { DesktopProvider } from '@/components/xp/DesktopContext';
import { FileDesktop } from '../FileDesktop';
import { filesApi, foldersApi, trashApi } from '../api';
import { folder, storedFile } from './helpers';

jest.mock('../api');
jest.mock('@/features/profile/api');

type Captured = { desktop?: ReturnType<typeof useDesktop>; wm?: ReturnType<typeof useWindowManager> };
const captured: Captured = {};

function Probe() {
  captured.desktop = useDesktop();
  captured.wm = useWindowManager();
  return null;
}

const docs = folder({ id: 'd1', name: 'Documentos' });
const system = folder({ id: 'd0', name: 'Extratos', isSystem: true });
const emptyTrash = { folders: [], files: [] };

function renderDesktop() {
  return renderWithProviders(
    <DesktopProvider>
      <FileDesktop />
      <Probe />
    </DesktopProvider>
  );
}

const icon = (label: string) => screen.findByLabelText(`Abrir ${label}`);
const menuItem = (name: string) => screen.getByRole('menuitem', { name });

beforeEach(() => {
  jest.mocked(foldersApi.getAll).mockResolvedValue([system, docs]);
  jest.mocked(foldersApi.getFiles).mockResolvedValue([]);
  jest.mocked(trashApi.get).mockResolvedValue(emptyTrash);
  jest.mocked(foldersApi.create).mockResolvedValue(folder({ id: 'd2', name: 'Nova pasta' }));
  jest.mocked(foldersApi.rename).mockResolvedValue(docs);
  jest.mocked(foldersApi.trash).mockResolvedValue(undefined);
  jest.mocked(trashApi.empty).mockResolvedValue(undefined);
  jest.mocked(filesApi.downloadUrl).mockResolvedValue('');
  jest.mocked(profileApi.get).mockResolvedValue(profile());
});

describe('FileDesktop', () => {
  async function folderPosition() {
    const el = await icon('Extratos');
    return { left: el.style.left, top: el.style.top };
  }

  it('places the folders right after the programs the user can see', async () => {
    setViewport(1200, 800);
    renderDesktop();

    await waitFor(() => expect(profileApi.get).toHaveBeenCalled());
    expect(await folderPosition()).toEqual({ left: '92px', top: '488px' });
  });

  it('leaves room for the admin only programs for admins', async () => {
    setViewport(1200, 800);
    jest.mocked(profileApi.get).mockResolvedValue(profile({ name: 'Gustavo', isAdmin: true }));
    renderDesktop();

    await waitFor(async () => expect(await folderPosition()).toEqual({ left: '92px', top: '568px' }));
  });

  it('shows an icon per folder and an empty trash', async () => {
    renderDesktop();
    expect(await icon('Documentos')).toBeTruthy();
    expect(await icon('Extratos')).toBeTruthy();
    expect(await icon('Lixeira')).toBeTruthy();
    expect(screen.getAllByTestId('icon-folder')).toHaveLength(2);
    expect(screen.getByTestId('icon-trash-o')).toBeTruthy();
  });

  it('opens a folder window from the icon menu', async () => {
    renderDesktop();
    fireEvent.contextMenu(await icon('Documentos'));
    fireEvent.click(menuItem('Abrir'));
    await waitFor(() => expect(foldersApi.getFiles).toHaveBeenCalledWith('d1'));
    expect(await screen.findByText('Esta pasta está vazia. Arraste arquivos para cá ou use Enviar arquivos.')).toBeTruthy();
  });

  it('opens the trash window from its menu', async () => {
    jest.mocked(trashApi.get).mockResolvedValue({ folders: [], files: [storedFile()] });
    renderDesktop();
    await waitFor(() => expect(screen.getByTestId('icon-trash')).toBeTruthy());
    fireEvent.contextMenu(await icon('Lixeira'));
    fireEvent.click(menuItem('Abrir'));
    expect(await screen.findByText('Local original: Documentos')).toBeTruthy();
  });

  it('opens folders and the trash on double click', async () => {
    const original = window.PointerEvent;
    window.PointerEvent = class extends MouseEvent {} as typeof PointerEvent;
    try {
      renderDesktop();
      const doubleClick = (element: HTMLElement) => {
        for (let i = 0; i < 2; i++) {
          fireEvent.pointerDown(element, { button: 0, clientX: 10, clientY: 10 });
          fireEvent.pointerUp(window);
        }
      };
      doubleClick(await icon('Documentos'));
      await waitFor(() => expect(captured.wm!.openWindows).toContain('folder:d1'));
      doubleClick(await icon('Lixeira'));
      expect(await screen.findByText('A Lixeira está vazia.')).toBeTruthy();
    } finally {
      window.PointerEvent = original;
    }
  });

  it('disables rename and delete for system folders', async () => {
    renderDesktop();
    fireEvent.contextMenu(await icon('Extratos'));
    expect(menuItem('Renomear').getAttribute('aria-disabled')).toBe('true');
    expect(menuItem('Excluir').getAttribute('aria-disabled')).toBe('true');
  });

  it('renames a folder in place', async () => {
    renderDesktop();
    fireEvent.contextMenu(await icon('Documentos'));
    fireEvent.click(menuItem('Renomear'));

    const input = screen.getByDisplayValue('Documentos');
    fireEvent.change(input, { target: { value: 'Contratos' } });
    fireEvent.blur(input);
    await waitFor(() => expect(foldersApi.rename).toHaveBeenCalledWith('d1', 'Contratos'));
  });

  it('reports a failed rename', async () => {
    jest.mocked(foldersApi.rename).mockRejectedValue(new Error('boom'));
    renderDesktop();
    fireEvent.contextMenu(await icon('Documentos'));
    fireEvent.click(menuItem('Renomear'));
    const input = screen.getByDisplayValue('Documentos');
    fireEvent.change(input, { target: { value: 'Contratos' } });
    fireEvent.blur(input);
    await waitFor(() => expect(screen.getByText('Não foi possível renomear a pasta')).toBeTruthy());
  });

  it('moves a folder to the trash after confirming, closing its window', async () => {
    renderDesktop();
    fireEvent.contextMenu(await icon('Documentos'));
    fireEvent.click(menuItem('Abrir'));
    await waitFor(() => expect(captured.wm!.openWindows).toContain('folder:d1'));

    jest.mocked(foldersApi.getAll).mockResolvedValue([system]);
    fireEvent.contextMenu(screen.getByLabelText('Abrir Documentos'));
    fireEvent.click(menuItem('Excluir'));
    expect(
      screen.getByText('Tem certeza de que deseja mover "Documentos" e todo o seu conteúdo para a Lixeira?')
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Sim'));

    await waitFor(() => expect(foldersApi.trash).toHaveBeenCalledWith('d1'));
    await waitFor(() => expect(captured.wm!.openWindows).not.toContain('folder:d1'));
    expect(screen.queryByLabelText('Abrir Documentos')).toBeNull();
  });

  it('keeps the folder when the confirmation is declined and reports failures', async () => {
    jest.mocked(foldersApi.trash).mockRejectedValue(new Error('boom'));
    renderDesktop();
    fireEvent.contextMenu(await icon('Documentos'));
    fireEvent.click(menuItem('Excluir'));
    fireEvent.click(screen.getByText('Não'));
    expect(foldersApi.trash).not.toHaveBeenCalled();

    fireEvent.contextMenu(screen.getByLabelText('Abrir Documentos'));
    fireEvent.click(menuItem('Excluir'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(screen.getByText('Não foi possível excluir a pasta')).toBeTruthy());
  });

  it('cannot empty an empty trash', async () => {
    renderDesktop();
    fireEvent.contextMenu(await icon('Lixeira'));
    expect(menuItem('Esvaziar Lixeira').getAttribute('aria-disabled')).toBe('true');
  });

  it('empties the trash after confirming', async () => {
    jest.mocked(trashApi.get).mockResolvedValue({
      folders: [{ id: 'd9', name: 'Antiga', fileCount: 0, deletedAt: null }],
      files: [storedFile()],
    });
    renderDesktop();
    await waitFor(() => expect(screen.getByTestId('icon-trash')).toBeTruthy());
    fireEvent.contextMenu(await icon('Lixeira'));
    fireEvent.click(menuItem('Esvaziar Lixeira'));
    expect(screen.getByText('Tem certeza de que deseja excluir permanentemente estes 2 itens?')).toBeTruthy();
    fireEvent.click(screen.getByText('Não'));
    expect(trashApi.empty).not.toHaveBeenCalled();

    fireEvent.contextMenu(screen.getByLabelText('Abrir Lixeira'));
    fireEvent.click(menuItem('Esvaziar Lixeira'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(trashApi.empty).toHaveBeenCalled());
  });

  it('reports a failure to empty the trash', async () => {
    jest.mocked(trashApi.get).mockResolvedValue({ folders: [], files: [storedFile()] });
    jest.mocked(trashApi.empty).mockRejectedValue(new Error('boom'));
    renderDesktop();
    await waitFor(() => expect(screen.getByTestId('icon-trash')).toBeTruthy());
    fireEvent.contextMenu(await icon('Lixeira'));
    fireEvent.click(menuItem('Esvaziar Lixeira'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(screen.getByText('Não foi possível esvaziar a Lixeira')).toBeTruthy());
  });

  it('creates a numbered "Nova pasta" from the desktop menu and starts renaming it', async () => {
    jest.mocked(foldersApi.getAll).mockResolvedValue([system, docs, folder({ id: 'd5', name: 'Nova pasta' })]);
    renderDesktop();
    await icon('Nova pasta');

    jest.mocked(foldersApi.create).mockResolvedValue(folder({ id: 'd6', name: 'Nova pasta (2)' }));
    const entries = captured.desktop!.backgroundMenu({ x: 300, y: 200 });
    expect(entries).toHaveLength(1);
    jest
      .mocked(foldersApi.getAll)
      .mockResolvedValue([system, docs, folder({ id: 'd5', name: 'Nova pasta' }), folder({ id: 'd6', name: 'Nova pasta (2)' })]);
    await act(async () => {
      (entries[0] as { onPress: () => void }).onPress();
    });

    expect(foldersApi.create).toHaveBeenCalledWith('Nova pasta (2)');
    await waitFor(() => expect(captured.desktop!.renamingIcon).toBe('folder:d6'));
    expect(captured.desktop!.iconPosition('folder:d6', 0)).toEqual(captured.desktop!.clampIcon({ x: 300, y: 200 }));
    expect(await screen.findByDisplayValue('Nova pasta (2)')).toBeTruthy();
  });

  it('reports a failure to create a folder', async () => {
    jest.mocked(foldersApi.create).mockRejectedValue(new Error('boom'));
    renderDesktop();
    await icon('Documentos');
    const [entry] = captured.desktop!.backgroundMenu({ x: 0, y: 0 }) as { onPress: () => void }[];
    await act(async () => entry.onPress());
    await waitFor(() => expect(screen.getByText('Não foi possível criar a pasta')).toBeTruthy());
  });

  it('removes its desktop menu on unmount', async () => {
    const { unmount } = renderDesktop();
    await icon('Documentos');
    const desktop = captured.desktop!;
    unmount();
    expect(desktop.backgroundMenu({ x: 0, y: 0 })).toEqual([]);
  });
});

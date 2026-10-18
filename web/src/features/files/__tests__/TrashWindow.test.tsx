import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { WindowIdProvider } from '@/components/xp';
import { TrashWindow } from '../TrashWindow';
import { trashApi } from '../api';
import { formatBytes, formatDate } from '../format';
import { OpenWindow, storedFile } from './helpers';

jest.mock('../api');

const trash = {
  folders: [{ id: 'd9', name: 'Antiga', fileCount: 3, deletedAt: '2026-10-05T09:00:00Z' }],
  files: [
    storedFile({ id: 'f1', name: 'extrato.pdf', folderName: 'Documentos', sizeBytes: 4096, deletedAt: null }),
    storedFile({ id: 'f2', name: 'solto.txt', folderName: null, sizeBytes: 10, deletedAt: '2026-10-06T09:00:00Z' }),
  ],
};

function renderTrash() {
  return renderWithProviders(
    <WindowIdProvider value="trash">
      <OpenWindow id="trash">
        <TrashWindow />
      </OpenWindow>
    </WindowIdProvider>
  );
}

const toolbar = (label: string) => screen.getAllByRole('button').find((b) => b.textContent === label)!;
const menuItem = (name: string) => screen.getByRole('menuitem', { name });

beforeEach(() => {
  jest.mocked(trashApi.get).mockResolvedValue(trash);
  jest.mocked(trashApi.empty).mockResolvedValue(undefined);
  jest.mocked(trashApi.restoreFolder).mockResolvedValue(undefined);
  jest.mocked(trashApi.restoreFile).mockResolvedValue(undefined);
  jest.mocked(trashApi.deleteFolder).mockResolvedValue(undefined);
  jest.mocked(trashApi.deleteFile).mockResolvedValue(undefined);
});

describe('TrashWindow', () => {
  it('lists deleted folders and files with their origin', async () => {
    renderTrash();
    await waitFor(() => expect(screen.getByText('Antiga')).toBeTruthy());
    expect(screen.getByText('3 objeto(s)')).toBeTruthy();
    expect(screen.getByText('Local original: Área de trabalho')).toBeTruthy();
    expect(screen.getByText('3 arquivo(s)')).toBeTruthy();
    expect(screen.getByText(formatDate('2026-10-05T09:00:00Z'))).toBeTruthy();
    expect(screen.getByText('Local original: Documentos')).toBeTruthy();
    expect(screen.getByText(formatBytes(4096))).toBeTruthy();
    expect(screen.getByText('Local original:')).toBeTruthy();
    expect(screen.getByTestId('icon-file-pdf-o')).toBeTruthy();
    expect(screen.getAllByTestId('icon-trash').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Antiga'));
  });

  it('shows the empty trash and does not ask to empty it', async () => {
    jest.mocked(trashApi.get).mockResolvedValue({ folders: [], files: [] });
    renderTrash();
    await waitFor(() => expect(screen.getByText('A Lixeira está vazia.')).toBeTruthy());
    expect(screen.getByText('0 objeto(s)')).toBeTruthy();
    expect(screen.getAllByTestId('icon-trash-o').length).toBeGreaterThan(0);

    fireEvent.click(toolbar('Esvaziar Lixeira'));
    expect(screen.queryByText(/excluir permanentemente/)).toBeNull();
  });

  it('empties the trash after confirming', async () => {
    renderTrash();
    await waitFor(() => expect(screen.getByText('Antiga')).toBeTruthy());

    fireEvent.click(toolbar('Esvaziar Lixeira'));
    expect(screen.getByText('Tem certeza de que deseja excluir permanentemente estes 3 itens?')).toBeTruthy();
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(trashApi.empty).toHaveBeenCalled());
  });

  it('keeps the trash when emptying is declined, and reports failures', async () => {
    jest.mocked(trashApi.empty).mockRejectedValue(new Error('boom'));
    renderTrash();
    await waitFor(() => expect(screen.getByText('Antiga')).toBeTruthy());

    fireEvent.click(toolbar('Esvaziar Lixeira'));
    fireEvent.click(screen.getByText('Não'));
    expect(trashApi.empty).not.toHaveBeenCalled();

    fireEvent.click(toolbar('Esvaziar Lixeira'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(screen.getByText('Não foi possível esvaziar a Lixeira')).toBeTruthy());
  });

  it('restores a folder and a file', async () => {
    renderTrash();
    fireEvent.contextMenu(await screen.findByText('Antiga'));
    fireEvent.click(menuItem('Restaurar'));
    await waitFor(() => expect(trashApi.restoreFolder).toHaveBeenCalledWith('d9'));

    fireEvent.contextMenu(screen.getByText('extrato.pdf'));
    fireEvent.click(menuItem('Restaurar'));
    await waitFor(() => expect(trashApi.restoreFile).toHaveBeenCalledWith('f1'));
  });

  it('reports a failure to restore', async () => {
    jest.mocked(trashApi.restoreFile).mockRejectedValue(new Error('boom'));
    renderTrash();
    fireEvent.contextMenu(await screen.findByText('solto.txt'));
    fireEvent.click(menuItem('Restaurar'));
    await waitFor(() => expect(screen.getByText('Não foi possível restaurar')).toBeTruthy());
  });

  it('deletes a folder forever after confirming', async () => {
    renderTrash();
    fireEvent.contextMenu(await screen.findByText('Antiga'));
    fireEvent.click(menuItem('Excluir'));
    expect(screen.getByText('Confirmar exclusão de pasta')).toBeTruthy();
    expect(screen.getByText('Tem certeza de que deseja excluir "Antiga" permanentemente?')).toBeTruthy();
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(trashApi.deleteFolder).toHaveBeenCalledWith('d9'));
  });

  it('deletes a file forever, or keeps it when declined, and reports failures', async () => {
    jest.mocked(trashApi.deleteFile).mockRejectedValueOnce(new Error('boom'));
    renderTrash();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Excluir'));
    expect(screen.getByText('Confirmar exclusão de arquivo')).toBeTruthy();
    fireEvent.click(screen.getByText('Não'));
    expect(trashApi.deleteFile).not.toHaveBeenCalled();

    fireEvent.contextMenu(screen.getByText('extrato.pdf'));
    fireEvent.click(menuItem('Excluir'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(screen.getByText('Não foi possível excluir o item')).toBeTruthy());
    expect(trashApi.deleteFile).toHaveBeenCalledWith('f1');
  });
});

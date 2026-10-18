import React from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { WindowIdProvider } from '@/components/xp';
import { FolderWindow } from '../FolderWindow';
import { filesApi, foldersApi } from '../api';
import { formatBytes, formatDate } from '../format';
import { deferred, fakeLocation, folder, OpenWindow, storedFile } from './helpers';

jest.mock('../api');

const docs = folder({ id: 'd1', name: 'Documentos' });
const photos = folder({ id: 'd2', name: 'Fotos' });
const pdf = storedFile({ id: 'f1', name: 'extrato.pdf', sizeBytes: 2048 });
const csv = storedFile({ id: 'f2', name: 'nubank.csv', sizeBytes: 512 });

function renderFolder() {
  const utils = renderWithProviders(
    <WindowIdProvider value="folder:d1">
      <OpenWindow id="folder:d1">
        <FolderWindow folder={docs} />
      </OpenWindow>
    </WindowIdProvider>
  );
  const input = utils.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { ...utils, input };
}

function toolbar(label: string) {
  return screen.getAllByRole('button').find((b) => b.textContent === label)!;
}

const menuItem = (name: string) => screen.getByRole('menuitem', { name });

beforeEach(() => {
  jest.mocked(foldersApi.getFiles).mockResolvedValue([pdf, csv]);
  jest.mocked(foldersApi.getAll).mockResolvedValue([docs, photos]);
  jest.mocked(foldersApi.upload).mockResolvedValue([]);
  jest.mocked(filesApi.update).mockResolvedValue(pdf);
  jest.mocked(filesApi.trash).mockResolvedValue(undefined);
  jest.mocked(filesApi.downloadUrl).mockResolvedValue('https://storage/extrato.pdf');
});

describe('FolderWindow', () => {
  it('lists the files with size and date', async () => {
    renderFolder();
    await waitFor(() => expect(screen.getByText('extrato.pdf')).toBeTruthy());
    expect(foldersApi.getFiles).toHaveBeenCalledWith('d1');
    expect(screen.getByText('nubank.csv')).toBeTruthy();
    expect(screen.getByText(formatBytes(2048))).toBeTruthy();
    expect(screen.getAllByText(formatDate(pdf.createdAt))).toHaveLength(2);
    expect(screen.getByText(`2 objeto(s) · ${formatBytes(2560)}`)).toBeTruthy();
    expect(screen.getByTestId('icon-file-pdf-o')).toBeTruthy();
    expect(screen.getByTestId('icon-file-excel-o')).toBeTruthy();
  });

  it('shows an empty folder and its background menu', async () => {
    jest.mocked(foldersApi.getFiles).mockResolvedValue([]);
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    renderFolder();
    const empty = await screen.findByText('Esta pasta está vazia. Arraste arquivos para cá ou use Enviar arquivos.');
    expect(screen.getByText('0 objeto(s) · 0 bytes')).toBeTruthy();

    fireEvent.contextMenu(empty);
    fireEvent.click(menuItem('Enviar arquivos...'));
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(empty);
    fireEvent.click(menuItem('Atualizar'));
    await waitFor(() => expect(foldersApi.getFiles).toHaveBeenCalledTimes(2));

    fireEvent.click(toolbar('Enviar arquivos'));
    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it('uploads the files picked in the file dialog', async () => {
    const upload = deferred<never[]>();
    jest.mocked(foldersApi.upload).mockReturnValue(upload.promise);
    const { input } = renderFolder();
    await waitFor(() => expect(screen.getByText('extrato.pdf')).toBeTruthy());

    const file = new File(['a'], 'novo.pdf');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText('Enviando arquivos...')).toBeTruthy());
    expect(foldersApi.upload).toHaveBeenCalledWith('d1', [file]);

    await act(async () => upload.resolve([]));
    await waitFor(() => expect(screen.queryByText('Enviando arquivos...')).toBeNull());
  });

  it('ignores an empty pick and reports upload failures', async () => {
    jest.mocked(foldersApi.upload).mockRejectedValue(new Error('boom'));
    const { input } = renderFolder();
    await waitFor(() => expect(screen.getByText('extrato.pdf')).toBeTruthy());

    fireEvent.change(input, { target: { files: [] } });
    expect(foldersApi.upload).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { files: null } });
    expect(foldersApi.upload).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { files: [new File(['a'], 'a.txt')] } });
    await waitFor(() => expect(screen.getByText('Não foi possível enviar os arquivos')).toBeTruthy());
  });

  it('uploads files dropped on the window', async () => {
    renderFolder();
    const name = await screen.findByText('extrato.pdf');
    const file = new File(['a'], 'solto.csv');
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { types: ['Files'], files: [file] } });
    const over = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(over, 'dataTransfer', { value: { types: ['Files'], files: [] } });
    act(() => {
      name.dispatchEvent(over);
    });
    expect(over.defaultPrevented).toBe(true);
    act(() => {
      name.dispatchEvent(drop);
    });
    await waitFor(() => expect(foldersApi.upload).toHaveBeenCalledWith('d1', [file]));
  });

  it('downloads a file on double click', async () => {
    const location = fakeLocation();
    try {
      renderFolder();
      const name = await screen.findByText('extrato.pdf');
      fireEvent.click(name);
      expect(filesApi.downloadUrl).not.toHaveBeenCalled();
      fireEvent.click(name);
      await waitFor(() => expect(location.fake.href).toBe('https://storage/extrato.pdf'));
      expect(filesApi.downloadUrl).toHaveBeenCalledWith('f1');
    } finally {
      location.restore();
    }
  });

  it('reports download failures from the context menu', async () => {
    jest.mocked(filesApi.downloadUrl).mockRejectedValue(new Error('boom'));
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Baixar'));
    await waitFor(() => expect(screen.getByText('Não foi possível baixar o arquivo')).toBeTruthy());
  });

  it('renames a file', async () => {
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Renomear'));

    const input = screen.getByDisplayValue('extrato.pdf');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('OK'));
    expect(filesApi.update).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '  outubro.pdf ' } });
    fireEvent.click(screen.getByText('OK'));
    await waitFor(() => expect(filesApi.update).toHaveBeenCalledWith('f1', { id: 'f1', name: 'outubro.pdf' }));
    await waitFor(() => expect(screen.queryByDisplayValue('outubro.pdf')).toBeNull());
  });

  it('reports rename failures and closes the form on cancel', async () => {
    jest.mocked(filesApi.update).mockRejectedValue(new Error('boom'));
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Renomear'));
    fireEvent.click(screen.getByText('OK'));
    await waitFor(() => expect(screen.getByText('Não foi possível alterar o arquivo')).toBeTruthy());
    const okButtons = screen.getAllByText('OK');
    fireEvent.click(okButtons[okButtons.length - 1]);
    await waitFor(() => expect(screen.queryByText('Não foi possível alterar o arquivo')).toBeNull());

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByDisplayValue('extrato.pdf')).toBeNull());
  });

  it('moves a file to another folder', async () => {
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Mover para a pasta...'));

    expect(screen.getByText('Mover "extrato.pdf" para:')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Fotos', { selector: 'option' })).toBeTruthy());
    expect(screen.queryByText('Documentos', { selector: 'option' })).toBeNull();
    fireEvent.click(screen.getByText('Mover'));
    await waitFor(() => expect(filesApi.update).toHaveBeenCalledWith('f1', { id: 'f1', folderId: 'd2' }));
  });

  it('does not move when there is no other folder, and can be cancelled', async () => {
    jest.mocked(foldersApi.getAll).mockResolvedValue([docs]);
    renderFolder();
    await screen.findByText('extrato.pdf');
    await waitFor(() => expect(foldersApi.getAll).toHaveBeenCalled());
    fireEvent.contextMenu(screen.getByText('extrato.pdf'));
    fireEvent.click(menuItem('Mover para a pasta...'));
    fireEvent.click(screen.getByText('Mover'));
    expect(filesApi.update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Mover "extrato.pdf" para:')).toBeNull());
  });

  it('sends a file to the trash after confirming', async () => {
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Excluir'));
    expect(screen.getByText('Tem certeza de que deseja enviar "extrato.pdf" para a Lixeira?')).toBeTruthy();
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(filesApi.trash).toHaveBeenCalledWith('f1'));
  });

  it('keeps the file when the trash confirmation is declined', async () => {
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('nubank.csv'));
    fireEvent.click(menuItem('Excluir'));
    fireEvent.click(screen.getByText('Não'));
    await waitFor(() => expect(screen.queryByText(/para a Lixeira\?/)).toBeNull());
    expect(filesApi.trash).not.toHaveBeenCalled();
  });

  it('reports trash failures', async () => {
    jest.mocked(filesApi.trash).mockRejectedValue(new Error('boom'));
    renderFolder();
    fireEvent.contextMenu(await screen.findByText('extrato.pdf'));
    fireEvent.click(menuItem('Excluir'));
    fireEvent.click(screen.getByText('Sim'));
    await waitFor(() => expect(screen.getByText('Não foi possível excluir o arquivo')).toBeTruthy());
  });

  it('highlights a file selected with the right button', async () => {
    renderFolder();
    const row = await screen.findByText('extrato.pdf');
    fireEvent.contextMenu(row);
    expect(within(document.body).getByRole('menu')).toBeTruthy();
  });
});

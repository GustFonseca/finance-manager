import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { filesApi } from '@/features/files/api';
import { RECEIPT_VIEW_GC_MS, RECEIPT_VIEW_STALE_MS, ReceiptViewer } from '../components/ReceiptViewer';
import { TransactionDto } from '../types';

jest.mock('@/features/files/api');

const expense: TransactionDto = {
  id: 't1',
  accountId: 'a1',
  accountName: 'Nubank',
  categoryId: 'c1',
  categoryName: 'Transporte',
  type: 'EXPENSE',
  amountCents: 24760,
  description: 'Auto Posto Estrela',
  date: '2026-10-17T12:00:00Z',
  recurrence: 'MONTHLY',
  merchantId: 'm1',
  merchantName: 'Auto Posto Estrela',
  receiptFileId: 'f1',
};

const image = { url: 'https://files/nota.jpg', name: 'nota.jpg', contentType: 'image/jpeg', sizeBytes: 62_000 };

function renderViewer(transaction: TransactionDto | null = expense, onClose = jest.fn()) {
  renderWithProviders(<ReceiptViewer transaction={transaction} onClose={onClose} />);
  return onClose;
}

describe('ReceiptViewer', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: { href: '' } });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    jest.resetAllMocks();
  });

  it('forgets signed URLs before they expire and never shows an expired one', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['files', 'view', 'f1'], { ...image, url: 'https://files/expirada.jpg' }, { updatedAt: Date.now() - RECEIPT_VIEW_GC_MS });
    jest.mocked(filesApi.view).mockResolvedValue(image);
    renderWithProviders(<ReceiptViewer transaction={expense} onClose={jest.fn()} />, { client });

    expect(screen.getByText('Carregando comprovante...')).toBeTruthy();
    expect(screen.queryByLabelText('Foto do comprovante nota.jpg')).toBeNull();
    await waitFor(() => expect(filesApi.view).toHaveBeenCalledWith('f1'));
    expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
    expect(client.getQueryCache().find({ queryKey: ['files', 'view', 'f1'] })?.options.gcTime).toBe(RECEIPT_VIEW_GC_MS);
    expect(RECEIPT_VIEW_STALE_MS).toBeLessThan(RECEIPT_VIEW_GC_MS);
    expect(RECEIPT_VIEW_GC_MS).toBeLessThan(120_000);
  });

  it('renders nothing without a transaction', () => {
    renderViewer(null);
    expect(screen.queryByText('Comprovante')).toBeNull();
    expect(filesApi.view).not.toHaveBeenCalled();
  });

  it('shows the transaction details and the photo', async () => {
    jest.mocked(filesApi.view).mockResolvedValue(image);
    const onClose = renderViewer();

    expect(screen.getByText('Carregando comprovante...')).toBeTruthy();
    expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
    expect(screen.getAllByText('Auto Posto Estrela').length).toBe(2);
    expect(screen.getByText('Transporte')).toBeTruthy();
    expect(screen.getByText('Nubank')).toBeTruthy();
    expect(screen.getByText('Mensal')).toBeTruthy();
    expect(screen.getByText(/nota\.jpg · /)).toBeTruthy();
    expect(screen.getByText(/R\$\s*247,60/)).toBeTruthy();
    fireEvent.click(screen.getByText('Fechar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows income positive, hides empty fields and falls back to the merchant name', async () => {
    jest.mocked(filesApi.view).mockResolvedValue(image);
    renderViewer({ ...expense, type: 'INCOME', description: '', recurrence: 'NONE', merchantName: 'Empresa' });

    expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
    expect(screen.queryByText('Recorrência')).toBeNull();
    expect(screen.getAllByText('Empresa').length).toBe(2);
  });

  it('names the transaction generically when it has no description nor merchant', () => {
    jest.mocked(filesApi.view).mockReturnValue(new Promise(() => {}));
    renderViewer({ ...expense, description: '', merchantName: '', receiptFileId: null });

    expect(screen.getByText('Transação')).toBeTruthy();
    expect(filesApi.view).not.toHaveBeenCalled();
  });

  it('embeds PDFs and explains other file types', async () => {
    jest.mocked(filesApi.view).mockResolvedValueOnce({ ...image, name: 'nota.pdf', contentType: 'application/pdf' });
    renderViewer();
    expect(await screen.findByTitle('Comprovante nota.pdf')).toBeTruthy();
  });

  it('asks to download files that cannot be previewed', async () => {
    jest.mocked(filesApi.view).mockResolvedValueOnce({ ...image, name: 'nota.zip', contentType: 'application/zip' });
    renderViewer();
    expect(await screen.findByText(/Não dá para mostrar este tipo de arquivo/)).toBeTruthy();
  });

  it('downloads the original file and alerts when it fails', async () => {
    jest.mocked(filesApi.view).mockResolvedValue(image);
    jest.mocked(filesApi.downloadUrl).mockResolvedValueOnce('https://files/download/nota.jpg');
    renderViewer();
    await screen.findByLabelText('Foto do comprovante nota.jpg');

    fireEvent.click(screen.getByText('Baixar'));
    await waitFor(() => expect(window.location.href).toBe('https://files/download/nota.jpg'));

    jest.mocked(filesApi.downloadUrl).mockRejectedValueOnce(apiError('Arquivo na lixeira'));
    fireEvent.click(screen.getByText('Baixar'));
    expect(await screen.findByText('Arquivo na lixeira')).toBeTruthy();
  });

  it('shows an error with retry when the receipt cannot be loaded', async () => {
    jest.mocked(filesApi.view).mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(image);
    renderViewer();

    expect(await screen.findByText('Não foi possível abrir o comprovante')).toBeTruthy();
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
  });
});

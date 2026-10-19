import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { apiError } from '@/test/http';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { foldersApi } from '@/features/files/api';
import { MISSING_ACCOUNT, MISSING_CATEGORY, MISSING_DATE } from '@/features/transactions/components/TransactionForm';
import { transactionsApi } from '@/features/transactions/api';
import { INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { todayKey } from '@/lib/periods';
import { PreparedImage, prepareImage, releaseImage } from '../image';
import { LazyReceiptScanner } from '../LazyReceiptScanner';
import { mergeReceipt, parseNfceQr, parseReceiptText } from '../parse';
import {
  HINTS,
  IMAGE_ERROR,
  PROBLEM_MESSAGES,
  RECEIPT_LATER_MESSAGE,
  SUCCESS_MESSAGE,
} from '../ReceiptScanner';
import { scanReceipt, ScanResult } from '../scan';

jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/files/api');
jest.mock('@/features/transactions/api');
jest.mock('../image', () => ({ prepareImage: jest.fn(), releaseImage: jest.fn() }));
jest.mock('../scan', () => ({ scanReceipt: jest.fn() }));

const NOW = new Date(2026, 9, 19, 12);
const KEY = '43261011222333000181650010000123451000012343';
const photo = new File(['jpeg'], 'nota-2026-10-19-1200.jpg', { type: 'image/jpeg' });
const prepared = { photo, previewUrl: 'blob:preview', ocr: {}, source: {}, width: 10, height: 10 } as PreparedImage;

const fullResult: ScanResult = {
  receipt: mergeReceipt(
    parseNfceQr(KEY),
    parseReceiptText('MERCADO\nCNPJ 11.222.333/0001-81\nVALOR A PAGAR 1.234,56\nEMISSAO 18/10/2026\nCARTAO DE CREDITO', NOW),
    { cnpj: '11222333000181', name: 'MERCADO CENTRAL', activity: 'Supermercados' }
  ),
  categoryId: 'car',
  problem: null,
};

const emptyResult: ScanResult = { receipt: mergeReceipt(null, null, null), categoryId: null, problem: 'ocr' };

type ScanOptions = Parameters<typeof scanReceipt>[1];

function deferredScan() {
  let options!: ScanOptions;
  let resolve!: (result: ScanResult) => void;
  let reject!: (error: unknown) => void;
  jest.mocked(scanReceipt).mockImplementation((_image, given) => {
    options = given;
    return new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
  });
  return { options: () => options, resolve: (r: ScanResult) => resolve(r), reject: (e: unknown) => reject(e) };
}

function button(label: string) {
  return screen
    .getAllByText(label)
    .map((element) => element.closest('[role=button]'))
    .find(Boolean) as HTMLElement;
}

function isDisabled(label: string) {
  return button(label).getAttribute('aria-disabled') === 'true';
}

function field(label: string, tag: 'input' | 'select') {
  return screen.getByText(label).parentElement!.querySelector(tag) as HTMLInputElement & HTMLSelectElement;
}

function fileInput() {
  return screen.getByLabelText('Arquivo da foto da nota') as HTMLInputElement;
}

async function choose(file: File | null) {
  await act(async () => {
    fireEvent.change(fileInput(), { target: { files: file ? [file] : [] } });
  });
}

async function renderScanner(onClose = jest.fn()) {
  const view = renderWithProviders(<LazyReceiptScanner visible onClose={onClose} />);
  await screen.findByText('Ler nota fiscal');
  return { ...view, onClose };
}

async function reachReview(result: ScanResult = fullResult) {
  jest.mocked(scanReceipt).mockResolvedValue(result);
  const view = await renderScanner();
  await choose(new File(['raw'], 'IMG.jpg', { type: 'image/jpeg' }));
  await act(async () => {
    fireEvent.click(button('Ler nota >'));
  });
  await screen.findByText('Confira e lance');
  return view;
}

beforeEach(() => {
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
    { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '' },
  ]);
  jest.mocked(categoriesApi.getAll).mockResolvedValue([
    { id: 'food', name: 'Alimentação', type: 'EXPENSE', color: '#000' },
    { id: 'car', name: 'Transporte', type: 'EXPENSE', color: '#000' },
  ]);
  jest.mocked(prepareImage).mockResolvedValue(prepared);
  jest.mocked(transactionsApi.create).mockResolvedValue({ id: 't9' } as never);
  jest.mocked(transactionsApi.setReceipt).mockResolvedValue({ id: 't9' } as never);
  jest.mocked(foldersApi.getAll).mockResolvedValue([{ id: 'f1', name: 'Comprovantes', isSystem: false }] as never);
  jest.mocked(foldersApi.upload).mockResolvedValue([{ id: 'file1' }] as never);
});

describe('LazyReceiptScanner', () => {
  it('renders nothing while hidden', async () => {
    await act(async () => {
      renderWithProviders(<LazyReceiptScanner visible={false} onClose={jest.fn()} />);
    });
    expect(screen.queryByText('Ler nota fiscal')).toBeNull();
  });
});

describe('ReceiptScanner', () => {
  it('starts on the photo step and opens the rear camera picker', async () => {
    await renderScanner();

    expect(screen.getByText('Tirar foto', { selector: '[role=button] *' })).toBeTruthy();
    expect(isDisabled('Ler nota >')).toBe(true);
    expect(isDisabled('Preencher à mão')).toBe(true);
    expect(fileInput().getAttribute('accept')).toBe('image/*');
    expect(fileInput().getAttribute('capture')).toBe('environment');

    const click = jest.spyOn(fileInput(), 'click');
    fireEvent.click(button('Tirar foto'));
    expect(click).toHaveBeenCalled();
  });

  it('shows the photo preview and ignores an empty choice', async () => {
    await renderScanner();
    await choose(null);
    expect(prepareImage).not.toHaveBeenCalled();

    await choose(new File(['raw'], 'IMG.jpg'));

    expect(screen.getByLabelText('Foto da nota')).toBeTruthy();
    expect(isDisabled('Ler nota >')).toBe(false);
    expect(isDisabled('Preencher à mão')).toBe(false);
  });

  it('shows the reading progress and fills the form with what was read', async () => {
    const scan = deferredScan();
    await renderScanner();
    await choose(new File(['raw'], 'IMG.jpg'));
    fireEvent.click(button('Ler nota >'));

    expect(screen.getByText('Lendo a nota…')).toBeTruthy();
    expect(screen.getByText('Procurando o QR Code')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
    act(() => {
      scan.options().onStage('text');
      scan.options().onProgress(0.5);
    });
    expect(screen.getByText('50%')).toBeTruthy();
    act(() => scan.options().onStage('company'));
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('Consultando a empresa')).toBeTruthy();

    await act(async () => scan.resolve(fullResult));

    expect(screen.getByText('Confira e lance')).toBeTruthy();
    expect(field('Valor:', 'input').value).toBe('1.234,56');
    expect(field('Descrição:', 'input').value).toBe('Mercado Central');
    expect(screen.getByLabelText('Data:')).toHaveProperty('value', '2026-10-18');
    await waitFor(() => expect(field('Categoria:', 'select').value).toBe('car'));
    expect(field('Conta:', 'select').value).toBe('a1');
    expect(screen.getByText('CNPJ: 11.222.333/0001-81')).toBeTruthy();
    expect(screen.getByText('Empresa: Mercado Central')).toBeTruthy();
    expect(screen.getByText('Supermercados')).toBeTruthy();
    expect(screen.getByText('Forma de pagamento: Cartão de crédito')).toBeTruthy();
    expect(screen.getByText(/QR Code da NFC-e lido/)).toBeTruthy();
    expect(screen.getByLabelText('Miniatura da nota')).toBeTruthy();
    expect(screen.queryByText(HINTS.total)).toBeNull();
  });

  it('cancels the reading and goes back to the photo', async () => {
    const scan = deferredScan();
    await renderScanner();
    await choose(new File(['raw'], 'IMG.jpg'));
    fireEvent.click(button('Ler nota >'));

    fireEvent.click(button('Cancelar'));

    expect(scan.options().signal.aborted).toBe(true);
    expect(screen.getByText('Tirar foto', { selector: '[role=button] *' })).toBeTruthy();
    await act(async () => scan.reject(new Error('aborted')));
    expect(screen.queryByText('Confira e lance')).toBeNull();
  });

  it('aborts the reading when closed', async () => {
    const scan = deferredScan();
    const { unmount } = await renderScanner();
    await choose(new File(['raw'], 'IMG.jpg'));
    fireEvent.click(button('Ler nota >'));

    unmount();

    expect(scan.options().signal.aborted).toBe(true);
    expect(releaseImage).toHaveBeenCalledWith(prepared);
  });

  it('highlights what could not be read and explains the problem', async () => {
    await reachReview(emptyResult);

    expect(screen.getByText(PROBLEM_MESSAGES.ocr)).toBeTruthy();
    expect(screen.getByText(HINTS.total)).toBeTruthy();
    expect(screen.getByText(HINTS.name)).toBeTruthy();
    expect(screen.getByText(HINTS.date)).toBeTruthy();
    expect(field('Valor:', 'input').value).toBe('');
    expect(field('Descrição:', 'input').value).toBe('Compra');
    expect(screen.getByLabelText('Data:')).toHaveProperty('value', todayKey());
    expect(screen.getByText('CNPJ: não encontrado')).toBeTruthy();
    expect(screen.getByText('Empresa: não identificada')).toBeTruthy();
    expect(screen.getByText('Forma de pagamento: não identificada')).toBeTruthy();
    expect(screen.getByText(/QR Code da NFC-e não encontrado/)).toBeTruthy();
  });

  it('creates the expense and attaches the photo as its receipt', async () => {
    const { onClose } = await reachReview();
    await waitFor(() => expect(field('Categoria:', 'select').value).toBe('car'));
    fireEvent.change(field('Conta:', 'select'), { target: { value: 'a2' } });
    fireEvent.change(field('Categoria:', 'select'), { target: { value: 'food' } });
    fireEvent.change(field('Valor:', 'input'), { target: { value: '99,90' } });
    fireEvent.change(field('Descrição:', 'input'), { target: { value: '  ' } });
    fireEvent.change(screen.getByLabelText('Data:'), { target: { value: '2026-10-17' } });

    await act(async () => {
      fireEvent.click(button('Lançar'));
    });

    expect(transactionsApi.create).toHaveBeenCalledWith({
      accountId: 'a2',
      categoryId: 'food',
      type: 'EXPENSE',
      amountCents: 9990,
      description: 'Compra',
      date: new Date(2026, 9, 17, 12).toISOString(),
    });
    await waitFor(() => expect(transactionsApi.setReceipt).toHaveBeenCalledWith('t9', 'file1'));
    expect(foldersApi.upload).toHaveBeenCalledWith('f1', [photo]);
    expect(await screen.findByText(SUCCESS_MESSAGE)).toBeTruthy();
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the transaction when the photo cannot be attached', async () => {
    jest.mocked(foldersApi.upload).mockRejectedValue(new Error('offline'));
    const { onClose } = await reachReview();

    await act(async () => {
      fireEvent.click(button('Lançar'));
    });

    expect(transactionsApi.create).toHaveBeenCalled();
    expect(await screen.findByText(RECEIPT_LATER_MESSAGE)).toBeTruthy();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the error when the transaction cannot be created', async () => {
    jest.mocked(transactionsApi.create).mockRejectedValue(apiError('Conta bloqueada'));
    const { onClose } = await reachReview();

    await act(async () => {
      fireEvent.click(button('Lançar'));
    });

    expect(screen.getByText('Conta bloqueada')).toBeTruthy();
    expect(foldersApi.upload).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(isDisabled('Lançar')).toBe(false);
  });

  it('ignores close requests while launching', async () => {
    let finish!: (value: unknown) => void;
    jest.mocked(transactionsApi.create).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never);
    const { onClose } = await reachReview();

    fireEvent.click(button('Lançar'));
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => finish({ id: 't9' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('validates the form like a new transaction', async () => {
    await reachReview(emptyResult);
    fireEvent.click(button('Lançar'));
    expect(screen.getByText(INVALID_AMOUNT_MESSAGE)).toBeTruthy();

    fireEvent.change(field('Valor:', 'input'), { target: { value: '10,00' } });
    fireEvent.change(screen.getByLabelText('Data:'), { target: { value: '' } });
    fireEvent.click(button('Lançar'));
    expect(screen.getByText(MISSING_DATE)).toBeTruthy();
    expect(transactionsApi.create).not.toHaveBeenCalled();
  });

  it('asks for an account', async () => {
    jest.mocked(accountsApi.getAll).mockResolvedValue([]);
    await reachReview();
    fireEvent.click(button('Lançar'));
    expect(screen.getByText(MISSING_ACCOUNT)).toBeTruthy();
  });

  it('asks for a category', async () => {
    jest.mocked(categoriesApi.getAll).mockResolvedValue([]);
    await reachReview();
    await waitFor(() => expect(field('Conta:', 'select').value).toBe('a1'));
    fireEvent.click(button('Lançar'));
    expect(screen.getByText(MISSING_CATEGORY)).toBeTruthy();
  });

  it('takes another photo from the review', async () => {
    await reachReview();
    const click = jest.spyOn(fileInput(), 'click');

    fireEvent.click(button('< Tirar outra'));

    expect(click).toHaveBeenCalled();
    expect(screen.getByText('Tirar foto', { selector: '[role=button] *' })).toBeTruthy();
    expect(isDisabled('Ler nota >')).toBe(true);
  });

  it('lets the user fill in by hand when the image cannot be opened, still attaching it', async () => {
    jest.mocked(prepareImage).mockRejectedValue(new Error('heic'));
    await renderScanner();
    const original = new File(['raw'], 'IMG.heic', { type: 'image/heic' });
    await choose(original);

    expect(screen.getByText(IMAGE_ERROR)).toBeTruthy();
    expect(isDisabled('Ler nota >')).toBe(true);
    fireEvent.click(button('Preencher à mão'));

    expect(screen.getByText('Confira e lance')).toBeTruthy();
    expect(screen.queryByLabelText('Miniatura da nota')).toBeNull();
    fireEvent.change(field('Valor:', 'input'), { target: { value: '15,00' } });
    await act(async () => {
      fireEvent.click(button('Lançar'));
    });
    await waitFor(() => expect(foldersApi.upload).toHaveBeenCalledWith('f1', [original]));
  });

  it('closes from the photo and review steps', async () => {
    const { onClose } = await renderScanner();
    fireEvent.click(button('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the review step', async () => {
    const { onClose } = await reachReview();
    fireEvent.click(button('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { foldersApi } from '@/features/files/api';
import { merchantsApi } from '@/features/merchants/api';
import { transactionsApi } from '@/features/transactions/api';
import { TransactionDto } from '@/features/transactions/types';
import { ImportWizard } from '../ImportWizard';
import { dayToIso } from '../text';
import { bufferOf, installTextCodec } from './textCodec';
import { apiError } from '@/test/http';

installTextCodec();

jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/files/api');
jest.mock('@/features/merchants/api');
jest.mock('@/features/transactions/api');

const transactions = jest.mocked(transactionsApi);
const merchants = jest.mocked(merchantsApi);
const folders = jest.mocked(foldersApi);

const CARD_CSV =
  'date,title,amount\n' +
  '2026-10-03,iFood *Restaurante,45.90\n' +
  '2026-10-05,Pagamento recebido,-1200.00\n' +
  '2026-10-06,Posto Shell,80.00\n';

const existingIfood = {
  id: 'old',
  date: new Date(2026, 9, 3, 12).toISOString(),
  type: 'EXPENSE',
  amountCents: 4590,
  description: 'iFood *Restaurante',
} as TransactionDto;

const match = (categoryId: string | null, skipReason: string | null = null) => ({
  description: '',
  name: '',
  kind: null,
  merchantId: null,
  categoryId,
  skipReason,
});

const MISSING_CATEGORY_TEXT = '1 linha(s) marcada(s) sem categoria. Escolha a categoria delas para importar.';

const systemFolder = { id: 'f1', name: 'Extratos', isSystem: true };

function statementFile(text: string, name = 'fatura.csv') {
  const file = new File([text], name, { type: 'text/csv' });
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(bufferOf(text)),
  });
  return file;
}

function fileInput() {
  return document.querySelector('input[type=file]') as HTMLInputElement;
}

async function chooseFile(file: File | null) {
  await act(async () => {
    fireEvent.change(fileInput(), { target: { files: file ? [file] : [] } });
  });
}

function button(label: string) {
  return screen.getByText(label).closest('[role=button]') as HTMLElement;
}

function isDisabled(label: string) {
  return button(label).getAttribute('aria-disabled') === 'true';
}

function rowCheckbox(description: string) {
  return screen.getByLabelText(`Importar ${description}`) as HTMLInputElement;
}

function rowSelect(description: string) {
  return rowCheckbox(description).parentElement!.querySelector('select') as HTMLSelectElement;
}

function renderWizard(onClose = jest.fn()) {
  const view = renderWithProviders(<ImportWizard visible onClose={onClose} />);
  return { ...view, onClose };
}

async function reachReview() {
  const view = renderWizard();
  await waitFor(() => expect(screen.getByRole('combobox')).toHaveProperty('value', 'a1'));
  await chooseFile(statementFile(CARD_CSV));
  fireEvent.click(screen.getByText('Avançar >'));
  await waitFor(() => expect(screen.getByText('Revise as transações')).toBeTruthy());
  return view;
}

beforeEach(() => {
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
    { id: 'a2', name: 'Cartão', balanceCents: 0, createdAt: '' },
  ]);
  jest.mocked(categoriesApi.getAll).mockResolvedValue([
    { id: 'food', name: 'Alimentação', type: 'EXPENSE', color: '#000' },
    { id: 'car', name: 'Transporte', type: 'EXPENSE', color: '#000' },
    { id: 'pay', name: 'Pagamentos', type: 'INCOME', color: '#000' },
  ]);
  transactions.getAll.mockResolvedValue([existingIfood]);
  transactions.importMany.mockResolvedValue(1);
  merchants.resolve.mockResolvedValue([
    match('food'),
    match('pay', 'Pagamento da fatura'),
    match(null),
  ]);
  folders.getAll.mockResolvedValue([{ id: 'f0', name: 'Documentos', isSystem: false }, systemFolder] as never);
  folders.upload.mockResolvedValue([]);
});

describe('ImportWizard', () => {
  it('starts on the file step with the first account selected', async () => {
    renderWizard();

    expect(screen.getByText('Assistente para importação de extrato')).toBeTruthy();
    expect(screen.getByText('Selecione o arquivo')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveProperty('value', 'a1'));
    expect(isDisabled('Avançar >')).toBe(true);
    expect(isDisabled('< Voltar')).toBe(true);
  });

  it('reads a chosen statement and lets the account be changed', async () => {
    renderWizard();
    await chooseFile(statementFile(CARD_CSV));

    expect(screen.getByText('Fatura do cartão Nubank (CSV): 3 lançamento(s) em "fatura.csv".')).toBeTruthy();
    await waitFor(() => expect(isDisabled('Avançar >')).toBe(false));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a2' } });
    expect(screen.getByRole('combobox')).toHaveProperty('value', 'a2');

    await chooseFile(null);
    expect(screen.queryByText(/lançamento\(s\) em/)).toBeNull();
    expect(isDisabled('Avançar >')).toBe(true);
  });

  it('shows parse errors', async () => {
    renderWizard();

    await chooseFile(statementFile('foo,bar\n1,2'));
    expect(screen.getByText(/Formato não reconhecido/)).toBeTruthy();

    await chooseFile(statementFile('date,title,amount\n'));
    expect(screen.getByText('O arquivo não tem transações.')).toBeTruthy();

    const broken = new File(['x'], 'x.csv');
    Object.defineProperty(broken, 'arrayBuffer', { value: () => Promise.reject(new Error('io')) });
    await chooseFile(broken);
    expect(screen.getByText('Não foi possível ler o arquivo.')).toBeTruthy();
    expect(isDisabled('Avançar >')).toBe(true);
  });

  it('shows the error when the existing transactions cannot be loaded', async () => {
    transactions.getAll.mockRejectedValue(apiError('Sessão expirada'));
    renderWizard();
    await chooseFile(statementFile(CARD_CSV));

    fireEvent.click(screen.getByText('Avançar >'));

    await waitFor(() => expect(screen.getByText('Sessão expirada')).toBeTruthy());
    expect(screen.getByText('Selecione o arquivo')).toBeTruthy();
    expect(merchants.resolve).not.toHaveBeenCalled();
  });

  it('reviews rows with duplicates, server suggestions and skip reasons', async () => {
    await reachReview();

    expect(transactions.getAll).toHaveBeenCalledWith({
      start: new Date('2026-10-03T00:00:00').toISOString(),
      end: new Date('2026-10-06T23:59:59').toISOString(),
    });
    expect(merchants.resolve).toHaveBeenCalledWith([
      { description: 'iFood *Restaurante', type: 'EXPENSE' },
      { description: 'Pagamento recebido', type: 'INCOME' },
      { description: 'Posto Shell', type: 'EXPENSE' },
    ]);

    expect(rowCheckbox('iFood *Restaurante').checked).toBe(false);
    expect(screen.getByText('Já existe no app')).toBeTruthy();
    expect(rowSelect('iFood *Restaurante').value).toBe('food');

    expect(rowCheckbox('Pagamento recebido').checked).toBe(false);
    expect(screen.getByText('Pagamento da fatura')).toBeTruthy();
    expect(rowSelect('Pagamento recebido').querySelectorAll('option')).toHaveLength(1);

    expect(rowCheckbox('Posto Shell').checked).toBe(true);
    const options = rowSelect('Posto Shell').querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('(escolha a categoria)');
    expect(options[0].disabled).toBe(true);
    expect(rowSelect('Posto Shell').value).toBe('');
    expect(rowSelect('iFood *Restaurante').querySelectorAll('option')).toHaveLength(2);
    expect(screen.getByText(MISSING_CATEGORY_TEXT)).toBeTruthy();

    expect(screen.getByText('03/10/2026')).toBeTruthy();
    expect(screen.getByText(/1 de 3 selecionada\(s\)/)).toBeTruthy();
    expect((screen.getByLabelText('Marcar todas') as HTMLInputElement).checked).toBe(false);
    expect(isDisabled('Importar')).toBe(true);
  });

  it('toggles rows and categories before importing', async () => {
    await reachReview();

    fireEvent.change(rowSelect('Posto Shell'), { target: { value: 'car' } });
    expect(isDisabled('Importar')).toBe(false);
    expect(screen.queryByText(/sem categoria/)).toBeNull();
    expect(rowSelect('Posto Shell').querySelectorAll('option')).toHaveLength(2);

    fireEvent.click(rowCheckbox('Posto Shell'));
    expect(screen.getByText(/0 de 3 selecionada\(s\)/)).toBeTruthy();
    expect(isDisabled('Importar')).toBe(true);

    fireEvent.click(screen.getByLabelText('Marcar todas'));
    expect(screen.getByText(/3 de 3 selecionada\(s\)/)).toBeTruthy();
    expect((screen.getByLabelText('Marcar todas') as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByText(/1\.200,00/)).toHaveLength(2);
    expect(screen.getByText(/125,90/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Marcar todas'));
    expect(screen.getByText(/0 de 3 selecionada\(s\)/)).toBeTruthy();
  });

  it('goes back to the file step', async () => {
    await reachReview();

    fireEvent.click(screen.getByText('< Voltar'));

    expect(screen.getByText('Selecione o arquivo')).toBeTruthy();
    expect(screen.getByText(/3 lançamento\(s\) em "fatura.csv"/)).toBeTruthy();
  });

  it('imports the selected rows and saves a copy of the statement', async () => {
    const { client, onClose } = await reachReview();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    let finish: (value: number) => void = () => {};
    transactions.importMany.mockReturnValue(new Promise((resolve) => (finish = resolve)));

    fireEvent.change(rowSelect('Posto Shell'), { target: { value: 'car' } });
    fireEvent.click(rowCheckbox('Pagamento recebido'));
    fireEvent.click(screen.getByText('Importar'));

    expect(screen.getByText('Importando 2 transação(ões)...')).toBeTruthy();
    expect(isDisabled('Cancelar')).toBe(true);
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).not.toHaveBeenCalled();
    expect(transactions.importMany).toHaveBeenCalledWith({
      accountId: 'a1',
      lines: [
        { date: dayToIso('2026-10-05'), description: 'Pagamento recebido', amountCents: 120000, type: 'INCOME', categoryId: 'pay' },
        { date: dayToIso('2026-10-06'), description: 'Posto Shell', amountCents: 8000, type: 'EXPENSE', categoryId: 'car' },
      ],
    });

    await act(async () => finish(2));

    await waitFor(() => expect(screen.getByText('Importação concluída')).toBeTruthy());
    expect(screen.getByText('2 transação(ões) importada(s).')).toBeTruthy();
    expect(screen.getByText('O arquivo foi salvo na pasta "Extratos" da área de trabalho.')).toBeTruthy();
    expect(folders.upload).toHaveBeenCalledWith('f1', [expect.any(File)]);
    expect(folders.upload.mock.calls[0][1][0].name).toBe('fatura.csv');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['folders'] });

    fireEvent.click(screen.getByText('Concluir'));
    expect(onClose).toHaveBeenCalled();
  });

  it('warns when there is no system folder to keep the statement', async () => {
    folders.getAll.mockResolvedValue([]);
    await reachReview();

    fireEvent.change(rowSelect('Posto Shell'), { target: { value: 'car' } });
    fireEvent.click(screen.getByText('Importar'));

    await waitFor(() =>
      expect(screen.getByText('Não foi possível salvar uma cópia do arquivo na área de trabalho.')).toBeTruthy()
    );
    expect(folders.upload).not.toHaveBeenCalled();
  });

  it('warns when the statement upload fails', async () => {
    folders.upload.mockRejectedValue(new Error('quota'));
    await reachReview();

    fireEvent.change(rowSelect('Posto Shell'), { target: { value: 'car' } });
    fireEvent.click(screen.getByText('Importar'));

    await waitFor(() =>
      expect(screen.getByText('Não foi possível salvar uma cópia do arquivo na área de trabalho.')).toBeTruthy()
    );
    expect(screen.getByText('1 transação(ões) importada(s).')).toBeTruthy();
  });

  it('reports a failed import without saving the statement', async () => {
    transactions.importMany.mockRejectedValue(apiError('Categoria inválida na linha 2'));
    await reachReview();

    fireEvent.change(rowSelect('Posto Shell'), { target: { value: 'car' } });
    fireEvent.click(screen.getByText('Importar'));

    await waitFor(() => expect(screen.getByText('A importação não foi feita')).toBeTruthy());
    expect(screen.getByText('Categoria inválida na linha 2')).toBeTruthy();
    expect(screen.getByText(/Nenhuma transação foi criada/)).toBeTruthy();
    expect(folders.getAll).not.toHaveBeenCalled();
  });

  it('includes rows without a server suggestion and resets when reopened', async () => {
    merchants.resolve.mockResolvedValue([]);
    transactions.getAll.mockResolvedValue([]);
    const onClose = jest.fn();
    const view = renderWithProviders(<ImportWizard visible onClose={onClose} />);
    await chooseFile(statementFile(CARD_CSV));
    fireEvent.click(screen.getByText('Avançar >'));
    await waitFor(() => expect(screen.getByText('Revise as transações')).toBeTruthy());

    expect(screen.getByText(/3 de 3 selecionada\(s\)/)).toBeTruthy();
    expect(screen.queryByText('Já existe no app')).toBeNull();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();

    view.rerender(<ImportWizard visible={false} onClose={onClose} />);
    view.rerender(<ImportWizard visible onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Selecione o arquivo')).toBeTruthy());
    expect(screen.queryByText(/lançamento\(s\) em/)).toBeNull();
  });

  it('cannot advance without an account', async () => {
    jest.mocked(accountsApi.getAll).mockResolvedValue([]);
    renderWizard();
    await chooseFile(statementFile(CARD_CSV));

    await waitFor(() => expect(screen.getByText(/3 lançamento\(s\)/)).toBeTruthy());
    expect(isDisabled('Avançar >')).toBe(true);
  });
});

import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { transactionsApi } from '@/features/transactions/api';
import { TransactionDto } from '@/features/transactions/types';
import { monthKeyOf, monthLabel, monthRange, twelveMonthsUntil, yearRange } from '@/lib/periods';
import { MerchantsScreen } from '../MerchantsScreen';
import { merchantsApi } from '../api';
import { MerchantDto, MerchantHistoryDto, MerchantSpendingDto, MerchantSpendingReportDto } from '../types';

jest.mock('../api');
jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/transactions/api');

const api = jest.mocked(merchantsApi);
const now = new Date();
const currentKey = monthKeyOf(now);
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const currentYear = now.getFullYear();

const spendingRow = (row: Partial<MerchantSpendingDto>): MerchantSpendingDto => ({
  merchantId: 'm1',
  name: 'iFood',
  kind: 'BUSINESS',
  categoryName: 'Alimentação',
  color: '#000',
  count: 4,
  cents: 30000,
  share: 0.6,
  averageTicketCents: 7500,
  lastDate: '2026-10-10T12:00:00Z',
  class: 'SUPERFLUOUS',
  ...row,
});

const report: MerchantSpendingReportDto = {
  totalCents: 50000,
  count: 7,
  merchants: [
    spendingRow({}),
    spendingRow({ merchantId: 'm2', name: 'Ana Souza', kind: 'PERSON', categoryName: '', cents: 15000, share: 0.3, class: 'ESSENTIAL' }),
    spendingRow({ merchantId: null, name: 'Sem cadastro', kind: 'OWN', categoryName: 'Outros', cents: 5000, share: 0.1, class: 'VARIABLE' }),
  ],
};

const ifood: MerchantDto = {
  id: 'm1',
  name: 'iFood',
  kind: 'BUSINESS',
  document: '14.380.200/0001-21',
  categoryId: 'c1',
  categoryName: 'Alimentação',
  class: null,
  activity: 'Restaurantes e similares',
};

const history = (merchant: MerchantDto, incomeCents = 0): MerchantHistoryDto => ({
  merchant,
  months: [
    { monthStart: '2026-09-01T03:00:00Z', expenseCents: 12000, incomeCents: 0, count: 2 },
    { monthStart: '2026-10-01T03:00:00Z', expenseCents: 18000, incomeCents: 0, count: 2 },
  ],
  expenseCents: 30000,
  incomeCents,
  count: 4,
  averageMonthlyCents: 15000,
  averageTicketCents: 7500,
});

const txn = (id: string, type: 'EXPENSE' | 'INCOME', description: string): TransactionDto => ({
  id,
  accountId: 'a1',
  accountName: 'Nubank',
  categoryId: 'c1',
  categoryName: 'Alimentação',
  type,
  amountCents: 2590,
  description,
  date: '2026-10-05T12:00:00Z',
  recurrence: 'NONE',
  merchantId: 'm1',
  merchantName: 'iFood',
});

const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function fieldOf(label: string, tag: 'input' | 'select') {
  return screen.getByText(label).parentElement!.querySelector(tag)!;
}

function table() {
  return screen.getByText('Compras').parentElement!.parentElement!;
}

function renderScreen() {
  return renderWithProviders(<MerchantsScreen />, { windowId: '/merchants' });
}

beforeEach(() => {
  api.unsorted.mockResolvedValue([]);
  api.spending.mockResolvedValue(report);
  api.history.mockResolvedValue(history(ifood));
  jest.mocked(accountsApi.getAll).mockResolvedValue([{ id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' }]);
  jest.mocked(categoriesApi.getAll).mockResolvedValue([
    { id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#000' },
    { id: 'c2', name: 'Lazer', type: 'EXPENSE', color: '#000' },
    { id: 'c3', name: 'Reembolso', type: 'INCOME', color: '#000' },
  ]);
  jest.mocked(transactionsApi.getAll).mockResolvedValue([]);
});

describe('MerchantsScreen', () => {
  it('summarizes the spending of the current month', async () => {
    renderScreen();

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(`3 estabelecimento(s) · ${monthLabel(currentKey)} · todas as contas`)).toBeTruthy()
    );
    expect(api.spending).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
    expect(screen.getByText('Gasto no mês')).toBeTruthy();
    expect(screen.getByText('7 compra(s) e pagamento(s)')).toBeTruthy();
    expect(screen.getByText(/R\$\s500,00/)).toBeTruthy();
    expect(screen.getByText(/R\$\s300,00 · 60% do total/)).toBeTruthy();
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('Pessoa')).toBeTruthy();
    expect(screen.getByText('Outros · Suas contas')).toBeTruthy();
    expect(screen.getByText('30%')).toBeTruthy();
  });

  it('shows placeholders when there is no spending', async () => {
    api.spending.mockResolvedValue({ totalCents: 0, count: 0, merchants: [] });
    renderScreen();

    await waitFor(() => expect(screen.getByText('Nenhum gasto encontrado neste período.')).toBeTruthy());
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('searches merchants ignoring accents and case', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Ana Souza')).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Procurar estabelecimento...'), { target: { value: '  ANÁ ' } });
    expect(within(table()).queryByText('iFood')).toBeNull();
    expect(within(table()).getByText('Ana Souza')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Procurar estabelecimento...'), { target: { value: 'zzz' } });
    expect(screen.getByText('Nenhum gasto encontrado neste período.')).toBeTruthy();
  });

  it('switches between months, years and accounts', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Ana Souza')).toBeTruthy());

    fireEvent.change(fieldOf('Mês:', 'select'), { target: { value: previousKey } });
    await waitFor(() =>
      expect(api.spending).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: undefined })
    );

    fireEvent.change(screen.getByDisplayValue('Por mês'), { target: { value: 'year' } });
    await waitFor(() => expect(screen.getByText('Gasto no ano')).toBeTruthy());
    expect(api.spending).toHaveBeenCalledWith({ ...yearRange(currentYear), accountId: undefined });
    await waitFor(() =>
      expect(screen.getByText(`3 estabelecimento(s) · ${currentYear} · todas as contas`)).toBeTruthy()
    );

    fireEvent.change(fieldOf('Ano:', 'select'), { target: { value: String(currentYear - 1) } });
    await waitFor(() =>
      expect(api.spending).toHaveBeenCalledWith({ ...yearRange(currentYear - 1), accountId: undefined })
    );

    await waitFor(() => expect(fieldOf('Conta:', 'select').querySelectorAll('option')).toHaveLength(2));
    fireEvent.change(fieldOf('Conta:', 'select'), { target: { value: 'a1' } });
    await waitFor(() =>
      expect(api.spending).toHaveBeenCalledWith({ ...yearRange(currentYear - 1), accountId: 'a1' })
    );
    await waitFor(() =>
      expect(screen.getByText(`3 estabelecimento(s) · ${currentYear - 1} · Nubank`)).toBeTruthy()
    );
  });

  it('shows the error state and retries', async () => {
    api.spending.mockRejectedValueOnce(apiError('Serviço indisponível'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Serviço indisponível')).toBeTruthy());
    expect(screen.getByText(/0 estabelecimento\(s\)/)).toBeTruthy();
    fireEvent.click(screen.getByText('Tentar de novo'));

    await waitFor(() => expect(screen.getByText('Ana Souza')).toBeTruthy());
  });

  it('does not open the detail of a merchant without a register', async () => {
    renderScreen();
    fireEvent.click(await screen.findByText('Sem cadastro'));
    expect(api.history).not.toHaveBeenCalled();
  });

  it('opens the merchant detail with its history and latest transactions', async () => {
    api.history.mockResolvedValue(history(ifood, 2590));
    jest.mocked(transactionsApi.getAll).mockResolvedValue([
      txn('t1', 'EXPENSE', 'Pedido 1'),
      txn('t2', 'INCOME', 'Estorno pedido'),
      ...Array.from({ length: 8 }, (_, i) => txn(`x${i}`, 'EXPENSE', `Extra ${i}`)),
    ]);
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    expect(screen.getByText('Carregando...')).toBeTruthy();

    await waitFor(() => expect(screen.getByText('Empresa · Alimentação · 14.380.200/0001-21')).toBeTruthy());
    expect(screen.getByText('Atividade: Restaurantes e similares')).toBeTruthy();
    const range = twelveMonthsUntil(currentKey);
    expect(api.history).toHaveBeenCalledWith('m1', range);
    expect(transactionsApi.getAll).toHaveBeenCalledWith({ ...range, merchantId: 'm1' });
    expect(screen.getByText('Gasto no período')).toBeTruthy();
    expect(screen.getByText('4 transação(ões)')).toBeTruthy();
    expect(screen.getByText('Recebido')).toBeTruthy();
    expect(screen.getByText(`Gasto por mês, 12 meses até ${monthLabel(currentKey)}`)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Pedido 1')).toBeTruthy());
    expect(screen.getByText('Estorno pedido')).toBeTruthy();
    expect(screen.getByText('Extra 5')).toBeTruthy();
    expect(screen.queryByText('Extra 6')).toBeNull();

    fireEvent.click(screen.getByText('Fechar'));
    await waitFor(() => expect(screen.queryByText('Gasto no período')).toBeNull());
  });

  it('labels the yearly history and merchants without category or document', async () => {
    api.history.mockResolvedValue(history({ ...ifood, id: 'm2', name: 'Ana Souza', kind: 'PERSON', categoryName: '', document: null, activity: null }));
    renderScreen();
    await waitFor(() => expect(screen.getByText('Ana Souza')).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue('Por mês'), { target: { value: 'year' } });

    fireEvent.click(await within(await waitFor(table)).findByText('Ana Souza'));
    await waitFor(() => expect(screen.getByText('Pessoa · sem categoria')).toBeTruthy());
    expect(screen.queryByText(/Atividade:/)).toBeNull();
    expect(api.history).toHaveBeenCalledWith('m2', yearRange(currentYear));
    expect(screen.getByText(`Gasto por mês, ${currentYear}`)).toBeTruthy();
    expect(screen.queryByText('Recebido')).toBeNull();
  });

  it('edits the merchant and reports the moved transactions', async () => {
    api.update.mockResolvedValue({ merchant: { ...ifood, categoryId: 'c2', categoryName: 'Lazer' }, updatedTransactions: 3 });
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    expect(screen.getByText('Editar estabelecimento')).toBeTruthy();
    expect(fieldOf('Nome:', 'input').value).toBe('iFood');
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    expect(screen.getByText('Lazer (despesa)')).toBeTruthy();
    expect(screen.getByText('Reembolso (receita)')).toBeTruthy();

    fireEvent.change(fieldOf('Nome:', 'input'), { target: { value: ' iFood Brasil ' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Suas contas' }));
    expect(screen.getByText(/ficam fora das análises de gastos/)).toBeTruthy();
    fireEvent.change(fieldOf('Categoria:', 'select'), { target: { value: 'c2' } });
    const apply = screen.getByLabelText('Mover também as transações já lançadas para esta categoria') as HTMLInputElement;
    expect(apply.checked).toBe(true);
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('m1', {
        name: 'iFood Brasil',
        kind: 'OWN',
        categoryId: 'c2',
        applyToTransactions: true,
        class: undefined,
      })
    );
    await waitFor(() => expect(screen.getByText('3 transação(ões) movida(s) para Lazer.')).toBeTruthy());
    expect(screen.getByText('Estabelecimento atualizado')).toBeTruthy();
    expect(screen.queryByText('Editar estabelecimento')).toBeNull();
  });

  it('saves without moving transactions and without an alert', async () => {
    api.update.mockResolvedValue({ merchant: ifood, updatedTransactions: 0 });
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    fireEvent.click(screen.getByLabelText('Mover também as transações já lançadas para esta categoria'));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('m1', {
        name: 'iFood',
        kind: 'BUSINESS',
        categoryId: 'c1',
        applyToTransactions: false,
        class: undefined,
      })
    );
    await waitFor(() => expect(screen.queryByText('Editar estabelecimento')).toBeNull());
    expect(screen.queryByText('Estabelecimento atualizado')).toBeNull();
  });

  it('clears the category, ignores an empty name and cancels', async () => {
    api.history.mockResolvedValue(history({ ...ifood, categoryId: null }));
    api.update.mockResolvedValue({ merchant: ifood, updatedTransactions: 0 });
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    expect(fieldOf('Categoria:', 'select').value).toBe('');
    expect(screen.queryByLabelText('Mover também as transações já lançadas para esta categoria')).toBeNull();

    fireEvent.change(fieldOf('Nome:', 'input'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(api.update).not.toHaveBeenCalled();

    fireEvent.change(fieldOf('Nome:', 'input'), { target: { value: 'iFood' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('m1', {
        name: 'iFood',
        kind: 'BUSINESS',
        categoryId: null,
        applyToTransactions: false,
        class: undefined,
      })
    );

    fireEvent.click(await screen.findByText('Editar...'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Editar estabelecimento')).toBeNull());
  });

  it('pre-fills the spending class and sends it only when it changes', async () => {
    api.history.mockResolvedValue(history({ ...ifood, class: 'SUPERFLUOUS' }));
    api.update.mockResolvedValue({ merchant: { ...ifood, class: 'ESSENTIAL' }, updatedTransactions: 0 });
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    const select = fieldOf('Classificação do gasto:', 'select');
    expect(select.value).toBe('SUPERFLUOUS');
    expect(Array.from(select.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'Automática (pelas regras)',
      'Essencial',
      'Variável',
      'Supérfluo',
    ]);

    fireEvent.change(select, { target: { value: 'ESSENTIAL' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('m1', expect.objectContaining({ class: 'ESSENTIAL' }))
    );
  });

  it('keeps the class untouched when it is not changed and resets it to automatic', async () => {
    api.history.mockResolvedValue(history({ ...ifood, class: 'VARIABLE' }));
    api.update.mockResolvedValue({ merchant: ifood, updatedTransactions: 0 });
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    expect(api.update.mock.calls[0][1].class).toBeUndefined();

    fireEvent.click(await screen.findByText('Editar...'));
    const select = fieldOf('Classificação do gasto:', 'select');
    expect(select.value).toBe('VARIABLE');
    fireEvent.change(select, { target: { value: '' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
    expect(api.update.mock.calls[1][1].class).toBeNull();
  });

  it('alerts when saving the merchant fails', async () => {
    api.update.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await within(await waitFor(table)).findByText('iFood'));
    fireEvent.click(await screen.findByText('Editar...'));
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Não foi possível salvar o estabelecimento')).toBeTruthy());
  });

  it('asks to organize the merchants without a category', async () => {
    api.unsorted.mockResolvedValue([report.merchants[1], report.merchants[0]]);
    renderScreen();

    await waitFor(() => expect(screen.getByText(/2 estabelecimento\(s\) sem categoria nos últimos 12 meses/)).toBeTruthy());
    expect(api.unsorted).toHaveBeenCalledWith(twelveMonthsUntil(currentKey));

    fireEvent.click(screen.getByText('Organizar agora'));

    expect(await screen.findByText(/do maior gasto para o menor/)).toBeTruthy();
    expect(screen.getAllByText('Organizar gastos')).toHaveLength(2);
    fireEvent.click(screen.getByText('Fechar'));
    await waitFor(() => expect(screen.queryByText(/do maior gasto para o menor/)).toBeNull());
  });

  it('hides the banner when everything is organized and opens the modal from the window action', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Ana Souza')).toBeTruthy());
    expect(screen.queryByText('Organizar agora')).toBeNull();

    fireEvent.click(screen.getByText('Organizar gastos'));

    await waitFor(() => expect(screen.getByText('Tudo organizado! Nenhum estabelecimento sem categoria.')).toBeTruthy());
  });
});

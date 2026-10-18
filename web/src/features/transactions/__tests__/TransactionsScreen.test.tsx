import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { merchantsApi } from '@/features/merchants/api';
import { TransactionsScreen } from '../TransactionsScreen';
import { transactionsApi } from '../api';
import { TransactionDto } from '../types';

jest.mock('../api');
jest.mock('@/features/merchants/api');
jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/files/api');

const api = jest.mocked(transactionsApi);

const ifood: TransactionDto = {
  id: 't1',
  accountId: 'a1',
  accountName: 'Nubank',
  categoryId: 'c1',
  categoryName: 'Alimentação',
  type: 'EXPENSE',
  amountCents: 4590,
  description: 'Compra no débito via NuPay - iFood',
  date: '2026-10-03T15:00:00Z',
  recurrence: 'NONE',
  merchantId: 'm1',
  merchantName: 'iFood',
};
const salary: TransactionDto = {
  ...ifood,
  id: 't2',
  categoryId: 'c2',
  categoryName: 'Salário',
  type: 'INCOME',
  amountCents: 650000,
  description: 'Pagamento empresa',
  merchantId: null,
  merchantName: '',
};
const bare: TransactionDto = { ...salary, id: 't3', description: '', categoryName: 'Outros' };

const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function fieldOf(label: string, tag: 'input' | 'select') {
  return screen.getByText(label).parentElement!.querySelector(tag)!;
}

function renderScreen() {
  return renderWithProviders(<TransactionsScreen />, { windowId: '/transactions' });
}

beforeEach(() => {
  api.getAll.mockResolvedValue([ifood]);
  jest.mocked(merchantsApi.getAll).mockResolvedValue([
    { id: 'm1', name: 'iFood', kind: 'BUSINESS', document: null, categoryId: 'c1', categoryName: 'Alimentação' },
  ]);
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
    { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '' },
  ]);
  jest.mocked(categoriesApi.getAll).mockImplementation(async (type) =>
    type === 'INCOME'
      ? [
          { id: 'c2', name: 'Salário', type: 'INCOME', color: '#000' },
          { id: 'c3', name: 'Freela', type: 'INCOME', color: '#000' },
        ]
      : [{ id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#000' }]
  );
});

describe('TransactionsScreen', () => {
  it('lists the transactions with their merchant', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('iFood').length).toBeGreaterThan(0));
    expect(screen.getByText('1 transação(ões)')).toBeTruthy();
    expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy();
    expect(screen.getByTestId('icon-arrow-circle-down')).toBeTruthy();
  });

  it('falls back to the description or category when there is no merchant', async () => {
    api.getAll.mockResolvedValue([salary, bare]);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Pagamento empresa')).toBeTruthy());
    expect(screen.getAllByText('Outros').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('icon-arrow-circle-up')).toHaveLength(2);
  });

  it('shows the empty state', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nenhuma transação encontrada')).toBeTruthy());
  });

  it('filters by merchant', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Todos')).toBeTruthy());
    await waitFor(() => expect(fieldOf('Estabelecimento:', 'select').querySelectorAll('option')).toHaveLength(2));

    fireEvent.change(fieldOf('Estabelecimento:', 'select'), { target: { value: 'm1' } });

    await waitFor(() => expect(api.getAll).toHaveBeenCalledWith({ merchantId: 'm1' }));
    expect(api.getAll).toHaveBeenCalledWith({});
  });

  it('creates an income transaction through the form', async () => {
    api.create.mockResolvedValue(salary);
    const { client } = renderScreen();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    fireEvent.click(await screen.findByText('Nova transação'));
    expect(screen.getByText('Nova Transação')).toBeTruthy();
    await waitFor(() => expect(fieldOf('Conta:', 'select').value).toBe('a1'));

    fireEvent.click(screen.getByText('Salvar'));
    expect(api.create).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: 'Receita' }));
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c2'));
    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '150,00' } });
    fireEvent.change(fieldOf('Descrição:', 'input'), { target: { value: 'Projeto' } });
    fireEvent.change(fieldOf('Conta:', 'select'), { target: { value: 'a2' } });
    fireEvent.change(fieldOf('Categoria:', 'select'), { target: { value: 'c3' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        accountId: 'a2',
        categoryId: 'c3',
        type: 'INCOME',
        amountCents: 15000,
        description: 'Projeto',
        date: expect.any(String),
      })
    );
    await waitFor(() => expect(screen.queryByText('Nova Transação')).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['merchants'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['savings'] });
  });

  it('does not submit without a category', async () => {
    jest.mocked(categoriesApi.getAll).mockResolvedValue([]);
    renderScreen();

    fireEvent.click(await screen.findByText('Nova transação'));
    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(api.create).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Nova Transação')).toBeNull());
  });

  it('alerts when creating fails', async () => {
    api.create.mockRejectedValue(apiError('Conta inexistente'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nova transação'));
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Conta inexistente')).toBeTruthy());
  });

  it('removes a transaction from the options menu', async () => {
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
    expect(screen.getAllByText('Compra no débito via NuPay - iFood')).toHaveLength(2);
    fireEvent.click(screen.getByText('Remover'));
    expect(screen.getByText('Deseja remover esta transação?')).toBeTruthy();
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('t1'));
  });

  it('uses the category as the menu title and keeps the transaction when cancelled', async () => {
    api.getAll.mockResolvedValue([bare]);
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Outros')).toHaveLength(1));
    fireEvent.click(screen.getAllByText('Outros')[0]);
    expect(screen.getAllByText('Outros')).toHaveLength(2);
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Deseja remover esta transação?')).toBeNull());
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('alerts when removing fails', async () => {
    api.remove.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
    fireEvent.click(screen.getByText('Remover'));
    fireEvent.click(screen.getByText('Remover'));

    await waitFor(() => expect(screen.getByText('Não foi possível remover a transação')).toBeTruthy());
  });

  it('deletes every transaction after confirming', async () => {
    api.removeAll.mockResolvedValue(12);
    renderScreen();

    fireEvent.click(await screen.findByText('Apagar todas'));
    expect(screen.getByText('Confirmar exclusão de todas as transações')).toBeTruthy();
    fireEvent.click(screen.getByText('Sim'));

    await waitFor(() => expect(screen.getByText('12 transação(ões) apagada(s).')).toBeTruthy());
    expect(screen.getByText('Transações apagadas')).toBeTruthy();
    fireEvent.click(screen.getByText('OK'));
    await waitFor(() => expect(screen.queryByText('Transações apagadas')).toBeNull());
  });

  it('keeps the transactions when the user answers "Não"', async () => {
    renderScreen();

    fireEvent.click(await screen.findByText('Apagar todas'));
    fireEvent.click(screen.getByText('Não'));

    await waitFor(() => expect(screen.queryByText('Confirmar exclusão de todas as transações')).toBeNull());
    expect(api.removeAll).not.toHaveBeenCalled();
  });

  it('alerts when deleting every transaction fails', async () => {
    api.removeAll.mockRejectedValue(new Error('x'));
    renderScreen();

    fireEvent.click(await screen.findByText('Apagar todas'));
    fireEvent.click(screen.getByText('Sim'));

    await waitFor(() => expect(screen.getByText('Não foi possível apagar as transações')).toBeTruthy());
  });

  it('opens and closes the import wizard', async () => {
    renderScreen();

    fireEvent.click(await screen.findByText('Importar extrato'));
    expect(screen.getByText('Assistente para importação de extrato')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Assistente para importação de extrato')).toBeNull());
  });
});

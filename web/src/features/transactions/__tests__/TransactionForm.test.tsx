import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { dayToIso } from '@/lib/periods';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import { MISSING_ACCOUNT, MISSING_CATEGORY, MISSING_DATE, TransactionForm } from '../components/TransactionForm';
import { TransactionDto } from '../types';

jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');

const freela: TransactionDto = {
  id: 't9',
  accountId: 'a2',
  accountName: 'Inter',
  categoryId: 'c3',
  categoryName: 'Freela',
  type: 'INCOME',
  amountCents: 123456,
  description: 'Projeto site',
  date: dayToIso('2026-09-15'),
  recurrence: 'MONTHLY',
  merchantId: null,
  merchantName: '',
};

function fieldOf(label: string, tag: 'input' | 'select') {
  return screen.getByText(label).parentElement!.querySelector(tag)!;
}

function dateInput() {
  return screen.getByLabelText('Data:') as HTMLInputElement;
}

const incomeCategories = [
  { id: 'c2', name: 'Salário', type: 'INCOME' as const, color: '#000' },
  { id: 'c3', name: 'Freela', type: 'INCOME' as const, color: '#000' },
];

function renderForm(transaction: TransactionDto | null = null, client = createTestQueryClient()) {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  const utils = renderWithProviders(
    <TransactionForm visible transaction={transaction} onClose={onClose} onSubmit={onSubmit} />,
    { client }
  );
  return { onSubmit, onClose, ...utils };
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'queueMicrotask'] });
  jest.setSystemTime(new Date(2026, 9, 18, 10));
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
    { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '' },
  ]);
  jest.mocked(categoriesApi.getAll).mockImplementation(async (type) =>
    type === 'INCOME'
      ? incomeCategories
      : [{ id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#000' }]
  );
});

afterEach(() => jest.useRealTimers());

describe('TransactionForm', () => {
  it('keeps the category of an income being edited while the income categories are still loading', async () => {
    let release: (value: typeof incomeCategories) => void = () => {};
    jest.mocked(categoriesApi.getAll).mockImplementation((type) =>
      type === 'INCOME'
        ? new Promise((resolve) => {
            release = resolve;
          })
        : Promise.resolve([{ id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#000' }])
    );
    const client = createTestQueryClient();
    const onSubmit = jest.fn();
    const props = { onClose: jest.fn(), onSubmit };
    const { rerender } = renderWithProviders(<TransactionForm visible={false} transaction={null} {...props} />, { client });
    await waitFor(() => expect(categoriesApi.getAll).toHaveBeenCalledWith('EXPENSE'));

    rerender(<TransactionForm visible transaction={freela} {...props} />);
    await act(async () => release(incomeCategories));

    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c3'));
    fireEvent.click(screen.getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c3', type: 'INCOME' }));
  });

  it('starts a new expense dated today', async () => {
    renderForm();

    expect(screen.getByText('Nova Transação')).toBeTruthy();
    expect(dateInput().value).toBe('2026-10-18');
    expect(screen.getByRole('radio', { name: 'Despesa' }).getAttribute('aria-checked')).toBe('true');
    await waitFor(() => expect(fieldOf('Conta:', 'select').value).toBe('a1'));
    await act(async () => {});
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
  });

  it('explains every missing or invalid field', async () => {
    const { onSubmit } = renderForm();
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    await act(async () => {});

    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10,00' } });
    fireEvent.change(dateInput(), { target: { value: '' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(MISSING_DATE);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for an account when there is none', async () => {
    jest.mocked(accountsApi.getAll).mockResolvedValue([]);
    const { onSubmit } = renderForm();
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    await act(async () => {});

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10,00' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(screen.getByRole('alert').textContent).toBe(MISSING_ACCOUNT);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for a category when the type has none', async () => {
    jest.mocked(categoriesApi.getAll).mockResolvedValue([]);
    const { onSubmit } = renderForm();
    await waitFor(() => expect(fieldOf('Conta:', 'select').value).toBe('a1'));
    await act(async () => {});

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10,00' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(screen.getByRole('alert').textContent).toBe(MISSING_CATEGORY);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the chosen day as a midday ISO date', async () => {
    const { onSubmit } = renderForm();
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    await act(async () => {});

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '45,90' } });
    fireEvent.change(fieldOf('Descrição:', 'input'), { target: { value: 'Mercado' } });
    fireEvent.change(dateInput(), { target: { value: '2026-10-02' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(onSubmit).toHaveBeenCalledWith({
      accountId: 'a1',
      categoryId: 'c1',
      type: 'EXPENSE',
      amountCents: 4590,
      description: 'Mercado',
      date: dayToIso('2026-10-02'),
      recurrence: undefined,
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('pre-fills the form when editing and keeps the recurrence', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['categories', 'INCOME'], incomeCategories);
    const onSubmit = jest.fn();
    const { rerender } = renderWithProviders(
      <TransactionForm visible={false} transaction={null} onClose={jest.fn()} onSubmit={onSubmit} />,
      { client }
    );
    await waitFor(() => expect(client.getQueryData(['categories', 'EXPENSE'])).toHaveLength(1));
    await waitFor(() => expect(client.getQueryData(['accounts'])).toHaveLength(2));
    await act(async () => {});

    rerender(<TransactionForm visible transaction={freela} onClose={jest.fn()} onSubmit={onSubmit} />);

    expect(screen.getByText('Editar Transação')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Receita' }).getAttribute('aria-checked')).toBe('true');
    expect(fieldOf('Valor:', 'input').value).toBe('1.234,56');
    expect(fieldOf('Descrição:', 'input').value).toBe('Projeto site');
    expect(dateInput().value).toBe('2026-09-15');
    await waitFor(() => expect(fieldOf('Conta:', 'select').value).toBe('a2'));
    expect(fieldOf('Categoria:', 'select').value).toBe('c3');

    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '1300' } });
    fireEvent.click(screen.getByText('Salvar'));

    expect(onSubmit).toHaveBeenCalledWith({
      accountId: 'a2',
      categoryId: 'c3',
      type: 'INCOME',
      amountCents: 130000,
      description: 'Projeto site',
      date: dayToIso('2026-09-15'),
      recurrence: 'MONTHLY',
    });
  });

  it('cancels', async () => {
    const { onClose } = renderForm();

    fireEvent.click(screen.getByText('Cancelar'));

    expect(onClose).toHaveBeenCalled();
  });
});

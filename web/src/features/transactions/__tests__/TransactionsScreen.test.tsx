import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { accountsApi } from '@/features/accounts/api';
import { categoriesApi } from '@/features/categories/api';
import { filesApi, foldersApi } from '@/features/files/api';
import { merchantsApi } from '@/features/merchants/api';
import { monthKeyOf, monthLabel, monthRange, yearRange } from '@/lib/periods';
import { SEARCH_DELAY_MS, TransactionsScreen } from '../TransactionsScreen';
import { transactionsApi } from '../api';
import { buildTransactionsCsv, downloadCsv } from '../exportCsv';
import { TransactionDto } from '../types';
import { apiError } from '@/test/http';

jest.mock('../api');
jest.mock('../exportCsv', () => ({ ...jest.requireActual('../exportCsv'), downloadCsv: jest.fn() }));
jest.mock('@/features/merchants/api');
jest.mock('@/features/accounts/api');
jest.mock('@/features/categories/api');
jest.mock('@/features/files/api');

const api = jest.mocked(transactionsApi);
const now = new Date();
const currentKey = monthKeyOf(now);
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const currentYear = now.getFullYear();

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
  receiptFileId: null,
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

function fieldOf(label: string, tag: 'input' | 'select') {
  const labels = screen.getAllByText(label);
  return labels[labels.length - 1].parentElement!.querySelector(tag)!;
}

function filterOf(label: string) {
  return screen.getAllByText(label)[0].parentElement!.querySelector('select')!;
}

function lastFilter() {
  return api.getAll.mock.calls[api.getAll.mock.calls.length - 1][0];
}

function renderScreen() {
  return renderWithProviders(<TransactionsScreen />, { windowId: '/transactions' });
}

beforeEach(() => {
  api.getAll.mockResolvedValue([ifood]);
  jest.mocked(merchantsApi.getAll).mockResolvedValue([
    { id: 'm1', name: 'iFood', kind: 'BUSINESS', document: null, categoryId: 'c1', categoryName: 'Alimentação', class: null, activity: null },
  ]);
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '' },
    { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '' },
  ]);
  jest.mocked(categoriesApi.getAll).mockImplementation(async (type) => {
    const income = [
      { id: 'c2', name: 'Salário', type: 'INCOME' as const, color: '#000' },
      { id: 'c3', name: 'Freela', type: 'INCOME' as const, color: '#000' },
    ];
    const expense = [{ id: 'c1', name: 'Alimentação', type: 'EXPENSE' as const, color: '#000' }];
    return type === 'INCOME' ? income : type === 'EXPENSE' ? expense : [...expense, ...income];
  });
});

describe('TransactionsScreen', () => {
  it('lists the transactions of the current month with their merchant', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText(`1 transação(ões) · ${monthLabel(currentKey)}`)).toBeTruthy());
    expect(api.getAll).toHaveBeenCalledWith(monthRange(currentKey));
    expect(screen.getAllByText('iFood').length).toBeGreaterThan(0);
    expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy();
    expect(screen.getByTestId('icon-arrow-circle-down')).toBeTruthy();
  });

  it('totals the income, expenses and balance', async () => {
    api.getAll.mockResolvedValue([ifood, salary]);
    renderScreen();

    await waitFor(() => expect(screen.getByText('Pagamento empresa')).toBeTruthy());
    const totals = screen.getByText(/^Entradas/).parentElement!.textContent!.replace(/\s+/g, ' ');
    expect(totals).toBe('Entradas R$ 6.500,00 · Saídas R$ 45,90 · Saldo + R$ 6.454,10');
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

    await waitFor(() => expect(screen.getByText(`0 transação(ões) · ${monthLabel(currentKey)}`)).toBeTruthy());
    expect(screen.getByText('Nenhuma transação encontrada com esses filtros')).toBeTruthy();
  });

  it('shows the error state and retries', async () => {
    api.getAll.mockRejectedValueOnce(apiError('Serviço indisponível'));
    renderScreen();

    await waitFor(() => expect(screen.getByText('Serviço indisponível')).toBeTruthy());
    fireEvent.click(screen.getByText('Tentar de novo'));

    await waitFor(() => expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy());
  });

  it('switches between months and years', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy());

    fireEvent.change(filterOf('Mês:'), { target: { value: previousKey } });
    await waitFor(() => expect(api.getAll).toHaveBeenCalledWith(monthRange(previousKey)));

    fireEvent.change(screen.getByDisplayValue('Por mês'), { target: { value: 'year' } });
    await waitFor(() => expect(api.getAll).toHaveBeenCalledWith(yearRange(currentYear)));
    await waitFor(() => expect(screen.getByText(`1 transação(ões) · ${currentYear}`)).toBeTruthy());

    fireEvent.change(filterOf('Ano:'), { target: { value: String(currentYear - 1) } });
    await waitFor(() => expect(api.getAll).toHaveBeenCalledWith(yearRange(currentYear - 1)));
  });

  it('filters by account, merchant, category and type', async () => {
    renderScreen();
    await waitFor(() => expect(filterOf('Estabelecimento:').querySelectorAll('option')).toHaveLength(2));
    await waitFor(() => expect(filterOf('Conta:').querySelectorAll('option')).toHaveLength(3));
    await waitFor(() => expect(filterOf('Categoria:').querySelectorAll('option')).toHaveLength(4));
    expect(Array.from(filterOf('Categoria:').querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'Todas',
      'Alimentação',
      'Salário',
      'Freela',
    ]);
    expect(Array.from(filterOf('Tipo:').querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'Todos',
      'Despesas',
      'Receitas',
    ]);

    fireEvent.change(filterOf('Conta:'), { target: { value: 'a2' } });
    await waitFor(() => expect(lastFilter()).toMatchObject({ accountId: 'a2' }));

    fireEvent.change(filterOf('Estabelecimento:'), { target: { value: 'm1' } });
    await waitFor(() => expect(lastFilter()).toMatchObject({ accountId: 'a2', merchantId: 'm1' }));

    fireEvent.change(filterOf('Categoria:'), { target: { value: 'c2' } });
    await waitFor(() => expect(lastFilter()).toMatchObject({ categoryId: 'c2' }));

    fireEvent.change(filterOf('Tipo:'), { target: { value: 'INCOME' } });
    await waitFor(() =>
      expect(lastFilter()).toEqual({
        ...monthRange(currentKey),
        accountId: 'a2',
        merchantId: 'm1',
        categoryId: 'c2',
        type: 'INCOME',
        search: undefined,
      })
    );

    fireEvent.change(filterOf('Tipo:'), { target: { value: '' } });
    await waitFor(() => expect(lastFilter()!.type).toBeUndefined());
  });

  it('searches after the typing pause', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy());
    jest.useFakeTimers();
    try {
      const search = screen.getByLabelText('Procurar transações');
      fireEvent.change(search, { target: { value: '  ifo' } });
      act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS - 1));
      fireEvent.change(search, { target: { value: '  ifood  ' } });
      act(() => jest.advanceTimersByTime(SEARCH_DELAY_MS - 1));
      expect(api.getAll.mock.calls.some(([filter]) => filter?.search)).toBe(false);

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(lastFilter()).toMatchObject({ search: 'ifood' });
      expect(api.getAll.mock.calls.some(([filter]) => filter?.search === 'ifo')).toBe(false);

      fireEvent.change(search, { target: { value: '   ' } });
      await act(async () => {
        jest.advanceTimersByTime(SEARCH_DELAY_MS);
      });
      expect(lastFilter()!.search).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
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
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Receita' }));
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c2'));
    await act(async () => {});
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
    expect(api.update).not.toHaveBeenCalled();
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

  it('alerts when saving fails', async () => {
    api.create.mockRejectedValue(apiError('Conta inexistente'));
    renderScreen();

    fireEvent.click(await screen.findByText('Nova transação'));
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    await act(async () => {});
    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() => expect(screen.getByText('Conta inexistente')).toBeTruthy());
    expect(screen.getByText('Nova Transação')).toBeTruthy();
  });

  it('edits a transaction from the options menu', async () => {
    api.update.mockResolvedValue({ ...ifood, amountCents: 5000 });
    renderScreen();
    await waitFor(() => expect(fieldOf('Categoria:', 'select')).toBeTruthy());

    fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
    fireEvent.click(screen.getByText('Editar'));

    expect(await screen.findByText('Editar Transação')).toBeTruthy();
    expect(fieldOf('Valor:', 'input').value).toBe('45,90');
    expect(fieldOf('Descrição:', 'input').value).toBe('Compra no débito via NuPay - iFood');
    await waitFor(() => expect(fieldOf('Categoria:', 'select').value).toBe('c1'));
    await act(async () => {});
    fireEvent.change(fieldOf('Valor:', 'input'), { target: { value: '50' } });
    fireEvent.click(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('t1', {
        accountId: 'a1',
        categoryId: 'c1',
        type: 'EXPENSE',
        amountCents: 5000,
        description: 'Compra no débito via NuPay - iFood',
        date: expect.any(String),
        recurrence: 'NONE',
      })
    );
    expect(api.create).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Editar Transação')).toBeNull());

    fireEvent.click(screen.getByText('Nova transação'));
    expect(await screen.findByText('Nova Transação')).toBeTruthy();
    expect(fieldOf('Valor:', 'input').value).toBe('');
  });

  it('removes a transaction from the options menu', async () => {
    api.remove.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
    expect(screen.getByText('iFood', { selector: '[role=dialog] *' })).toBeTruthy();
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

  it('exports the filtered transactions of the month', async () => {
    api.getAll.mockResolvedValue([ifood, salary]);
    renderScreen();
    await waitFor(() => expect(screen.getByText('Pagamento empresa')).toBeTruthy());

    fireEvent.click(screen.getByText('Exportar CSV'));

    expect(downloadCsv).toHaveBeenCalledWith(`transacoes-${currentKey}.csv`, buildTransactionsCsv([ifood, salary]));
  });

  it('names the export after the year when grouping by year', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Compra no débito via NuPay - iFood')).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue('Por mês'), { target: { value: 'year' } });
    await waitFor(() => expect(screen.getByText(`1 transação(ões) · ${currentYear}`)).toBeTruthy());

    fireEvent.click(screen.getByText('Exportar CSV'));

    expect(downloadCsv).toHaveBeenCalledWith(`transacoes-${currentYear}.csv`, buildTransactionsCsv([ifood]));
  });

  it('alerts instead of exporting an empty list', async () => {
    api.getAll.mockResolvedValue([]);
    renderScreen();
    await waitFor(() => expect(screen.getByText(`0 transação(ões) · ${monthLabel(currentKey)}`)).toBeTruthy());

    fireEvent.click(screen.getByText('Exportar CSV'));

    expect(await screen.findByText('Não há transações no filtro atual para exportar.')).toBeTruthy();
    expect(downloadCsv).not.toHaveBeenCalled();
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

  it('opens and closes the receipt scanner', async () => {
    renderScreen();

    fireEvent.click(await screen.findByText('Ler nota'));
    expect(await screen.findByText('Ler nota fiscal')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Ler nota fiscal')).toBeNull());
  });

  it('opens and closes the import wizard', async () => {
    renderScreen();

    fireEvent.click(await screen.findByText('Importar extrato'));
    expect(screen.getByText('Assistente para importação de extrato')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => expect(screen.queryByText('Assistente para importação de extrato')).toBeNull());
  });
  describe('receipts', () => {
    const withReceipt: TransactionDto = { ...ifood, receiptFileId: 'f1' };
    const receiptsFolder = { id: 'fo1', name: 'Comprovantes', isSystem: false, fileCount: 0, createdAt: '' };

    function receiptInput() {
      return screen.getByLabelText('Arquivo do comprovante') as HTMLInputElement;
    }

    function chooseReceipt(files: File[]) {
      fireEvent.change(receiptInput(), { target: { files } });
    }

    afterEach(() => jest.restoreAllMocks());

    it('opens the receipt viewer from the paperclip and from the menu', async () => {
      jest.mocked(filesApi.view).mockResolvedValue({ url: 'https://files/nota.jpg', name: 'nota.jpg', contentType: 'image/jpeg', sizeBytes: 2048 });
      api.getAll.mockResolvedValue([withReceipt, salary]);
      renderScreen();

      fireEvent.click(await screen.findByRole('button', { name: 'Abrir comprovante' }));
      expect(screen.getAllByTestId('icon-paperclip').length).toBeGreaterThan(0);
      expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
      expect(filesApi.view).toHaveBeenCalledWith('f1');
      fireEvent.click(screen.getByText('Fechar'));
      expect(screen.queryByLabelText('Foto do comprovante nota.jpg')).toBeNull();

      fireEvent.click(screen.getByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Ver comprovante'));
      expect(await screen.findByLabelText('Foto do comprovante nota.jpg')).toBeTruthy();
    });

    it('attaches a receipt saved in the Comprovantes folder', async () => {
      const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      jest.mocked(foldersApi.getAll).mockResolvedValue([]);
      jest.mocked(foldersApi.create).mockResolvedValue(receiptsFolder);
      jest.mocked(foldersApi.upload).mockResolvedValue([{ id: 'f7' }] as never);
      api.setReceipt.mockResolvedValue({ ...ifood, receiptFileId: 'f7' });
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      expect(screen.queryByText('Ver comprovante')).toBeNull();
      fireEvent.click(screen.getByText('Anexar comprovante'));
      expect(click).toHaveBeenCalled();
      const file = new File(['x'], 'nota.pdf', { type: 'application/pdf' });
      chooseReceipt([file]);

      expect(await screen.findByText('O arquivo "nota.pdf" foi salvo na pasta "Comprovantes" e anexado à transação.')).toBeTruthy();
      expect(foldersApi.create).toHaveBeenCalledWith('Comprovantes');
      expect(foldersApi.upload).toHaveBeenCalledWith('fo1', [file]);
      expect(api.setReceipt).toHaveBeenCalledWith('t1', 'f7');
    });

    it('alerts when attaching fails', async () => {
      jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      jest.mocked(foldersApi.getAll).mockRejectedValue(apiError('Arquivo muito grande'));
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Anexar comprovante'));
      chooseReceipt([new File(['x'], 'nota.pdf')]);

      expect(await screen.findByText('Arquivo muito grande')).toBeTruthy();
      expect(api.setReceipt).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when attaching fails', async () => {
      jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      jest.mocked(foldersApi.getAll).mockResolvedValue([receiptsFolder]);
      jest.mocked(foldersApi.upload).mockResolvedValue([{ id: 'f7' }] as never);
      api.setReceipt.mockRejectedValue(new Error('x'));
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Anexar comprovante'));
      chooseReceipt([new File(['x'], 'nota.pdf')]);

      expect(await screen.findByText('Não foi possível anexar o comprovante')).toBeTruthy();
    });

    it('ignores an empty choice and a file chosen without a transaction', async () => {
      jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Anexar comprovante'));
      chooseReceipt([]);
      chooseReceipt([new File(['x'], 'nota.pdf')]);

      await act(async () => {});
      expect(foldersApi.getAll).not.toHaveBeenCalled();
      expect(api.setReceipt).not.toHaveBeenCalled();
    });

    it('removes the receipt after confirmation', async () => {
      api.getAll.mockResolvedValue([withReceipt]);
      api.setReceipt.mockResolvedValue(ifood);
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Remover comprovante'));
      expect(screen.getByText(/O arquivo continua na pasta "Comprovantes"/)).toBeTruthy();
      fireEvent.click(screen.getByText('Remover'));

      await waitFor(() => expect(api.setReceipt).toHaveBeenCalledWith('t1', null));
    });

    it('keeps the receipt when cancelled and alerts when removing fails', async () => {
      api.getAll.mockResolvedValue([withReceipt]);
      api.setReceipt.mockRejectedValue(new Error('x'));
      renderScreen();

      fireEvent.click(await screen.findByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Remover comprovante'));
      fireEvent.click(screen.getByText('Cancelar'));
      await waitFor(() => expect(screen.queryByText(/O arquivo continua/)).toBeNull());
      expect(api.setReceipt).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Compra no débito via NuPay - iFood'));
      fireEvent.click(screen.getByText('Remover comprovante'));
      fireEvent.click(screen.getByText('Remover'));
      expect(await screen.findByText('Não foi possível remover o comprovante')).toBeTruthy();
    });
  });
});

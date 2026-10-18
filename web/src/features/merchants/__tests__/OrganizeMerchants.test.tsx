import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { categoriesApi } from '@/features/categories/api';
import { monthKeyOf, twelveMonthsUntil } from '@/lib/periods';
import { renderWithProviders } from '@/test/render';
import { merchantsApi } from '../api';
import { OrganizeMerchants } from '../components/OrganizeMerchants';
import { MerchantSpendingDto } from '../types';

jest.mock('../api');
jest.mock('@/features/categories/api');

const api = jest.mocked(merchantsApi);

const row = (overrides: Partial<MerchantSpendingDto>): MerchantSpendingDto => ({
  merchantId: 'm1',
  name: 'Padaria Pão Bom',
  kind: 'BUSINESS',
  categoryName: 'Outros',
  color: '#000',
  count: 3,
  cents: 4500,
  share: 0.1,
  averageTicketCents: 1500,
  lastDate: '2026-10-10T12:00:00Z',
  class: 'VARIABLE',
  ...overrides,
});

const apiError = (message: string) => ({ isAxiosError: true, response: { status: 400, data: { message } } });

function rowSelect(name: string) {
  return screen.getByText(name).parentElement!.parentElement!.querySelector('select') as HTMLSelectElement;
}

function renderModal(visible = true) {
  const onClose = jest.fn();
  const utils = renderWithProviders(<OrganizeMerchants visible={visible} onClose={onClose} />);
  return { onClose, ...utils };
}

beforeEach(() => {
  jest.mocked(categoriesApi.getAll).mockResolvedValue([
    { id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#000' },
    { id: 'c9', name: 'Outros', type: 'EXPENSE', color: '#000' },
  ]);
  api.unsorted.mockResolvedValue([
    row({}),
    row({ merchantId: 'm2', name: 'Ana Souza', kind: 'PERSON', categoryName: '', count: 1, cents: 20000 }),
  ]);
});

describe('OrganizeMerchants', () => {
  it('does not load anything while hidden', () => {
    renderModal(false);

    expect(screen.queryByText('Organizar gastos')).toBeNull();
    expect(api.unsorted).not.toHaveBeenCalled();
  });

  it('lists the merchants without a category of the last twelve months', async () => {
    renderModal();

    expect(screen.getByText('Organizar gastos')).toBeTruthy();
    expect(screen.getByText('Carregando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Padaria Pão Bom')).toBeTruthy());
    expect(api.unsorted).toHaveBeenCalledWith(twelveMonthsUntil(monthKeyOf(new Date())));
    expect(screen.getByText(/Empresa · 3 transação\(ões\) · R\$\s45,00/)).toBeTruthy();
    expect(screen.getByText(/Pessoa · 1 transação\(ões\) · R\$\s200,00/)).toBeTruthy();

    await waitFor(() => expect(rowSelect('Padaria Pão Bom').querySelectorAll('option')).toHaveLength(2));
    const options = Array.from(rowSelect('Padaria Pão Bom').querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['(escolha a categoria)', 'Alimentação']);
    expect(rowSelect('Ana Souza').querySelectorAll('option')).toHaveLength(3);
    expect(screen.queryByText(/organizado\(s\) agora/)).toBeNull();
  });

  it('shows when everything is organized', async () => {
    api.unsorted.mockResolvedValue([]);
    renderModal();

    await waitFor(() => expect(screen.getByText('Tudo organizado! Nenhum estabelecimento sem categoria.')).toBeTruthy());
  });

  it('assigns the chosen category to the merchant and its transactions', async () => {
    let finish: () => void = () => {};
    api.update.mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({ merchant: {} as never, updatedTransactions: 3 });
      })
    );
    renderModal();
    await waitFor(() => expect(rowSelect('Padaria Pão Bom').querySelectorAll('option')).toHaveLength(2));

    fireEvent.change(rowSelect('Padaria Pão Bom'), { target: { value: 'c1' } });

    await waitFor(() => expect(screen.getByText('Salvando...')).toBeTruthy());
    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('m1', {
        name: 'Padaria Pão Bom',
        kind: 'BUSINESS',
        categoryId: 'c1',
        applyToTransactions: true,
      })
    );

    await act(async () => finish());

    await waitFor(() => expect(screen.getByText('1 estabelecimento(s) organizado(s) agora.')).toBeTruthy());
    expect(screen.queryByText('Salvando...')).toBeNull();
  });

  it('alerts when saving the category fails', async () => {
    api.update.mockRejectedValue(apiError('Categoria inválida'));
    renderModal();
    await waitFor(() => expect(rowSelect('Ana Souza').querySelectorAll('option')).toHaveLength(3));

    fireEvent.change(rowSelect('Ana Souza'), { target: { value: 'c9' } });

    await waitFor(() => expect(screen.getByText('Categoria inválida')).toBeTruthy());
    expect(screen.queryByText(/organizado\(s\) agora/)).toBeNull();
    expect(screen.queryByText('Salvando...')).toBeNull();
  });

  it('closes from the button', async () => {
    const { onClose } = renderModal();
    await waitFor(() => expect(screen.getByText('Padaria Pão Bom')).toBeTruthy());

    fireEvent.click(screen.getByText('Fechar'));

    expect(onClose).toHaveBeenCalled();
  });
});

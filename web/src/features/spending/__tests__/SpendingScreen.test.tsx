import React from 'react';
import './matchMedia';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { accountsApi } from '@/features/accounts/api';
import { SpendingScreen } from '../SpendingScreen';
import { spendingApi } from '../api';
import { SpendingAnalysisDto } from '../types';

jest.mock('../api');
jest.mock('@/features/accounts/api');

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

const now = new Date();
const currentKey = monthKeyOf(now);
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

const analysis: SpendingAnalysisDto = {
  monthExpenseCents: 400000,
  averageExpenseCents: 350000,
  byClass: [
    { class: 'ESSENTIAL', cents: 240000, share: 0.6 },
    { class: 'VARIABLE', cents: 100000, share: 0.25 },
    { class: 'SUPERFLUOUS', cents: 60000, share: 0.15 },
  ],
  byCategory: [
    { categoryId: 'c1', categoryName: 'Moradia', color: '#000', cents: 200000, share: 0.5, averageCents: 190000, class: 'ESSENTIAL' },
    { categoryId: 'c2', categoryName: 'Delivery', color: '#000', cents: 60000, share: 0.15, averageCents: 0, class: 'SUPERFLUOUS' },
  ],
  months: [
    { monthStart: '2026-09-01T03:00:00Z', essentialCents: 230000, variableCents: 90000, superfluousCents: 50000 },
    { monthStart: '2026-10-01T03:00:00Z', essentialCents: 240000, variableCents: 100000, superfluousCents: 60000 },
  ],
  topMerchants: [
    {
      merchantId: 'm1', name: 'iFood', kind: 'MERCHANT', categoryName: 'Delivery', color: '#000', count: 12,
      cents: 60000, share: 0.15, averageTicketCents: 5000, lastDate: '2026-10-10T00:00:00Z', class: 'SUPERFLUOUS',
    } as never,
  ],
  reducible: [
    {
      merchantId: 'm1', name: 'iFood', categoryId: 'c2', subscription: false, class: 'SUPERFLUOUS',
      timesPerMonth: 12, monthlyCents: 60000, potentialCents: 30000, detail: '12 pedidos por mês',
    },
  ],
  reduciblePotentialCents: 30000,
};

beforeEach(() => {
  jest.mocked(accountsApi.getAll).mockResolvedValue([
    { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '2026-01-01T00:00:00Z' },
  ]);
  jest.mocked(spendingApi.get).mockResolvedValue(analysis);
});

describe('SpendingScreen', () => {
  it('shows the analysis of the current month', async () => {
    renderWithProviders(<SpendingScreen />, { windowId: '/spending' });

    expect(screen.getByText('Analisando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Gasto no mês')).toBeTruthy());
    expect(screen.getByText(`Gastos de ${monthLabel(currentKey)} · todas as contas`)).toBeTruthy();
    expect(screen.getByText(money(400000))).toBeTruthy();
    expect(screen.getByText(`Até hoje. Média mensal dos 3 meses anteriores: ${money(350000)}`)).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
    expect(screen.getByText(`${money(60000)} em gastos dispensáveis`)).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText(`${money(240000)} em gastos essenciais`)).toBeTruthy();
    expect(screen.getByText('por mês, com os cortes sugeridos abaixo')).toBeTruthy();
    expect(screen.getByText(/pela média dos últimos meses/)).toBeTruthy();
    expect(screen.getByText('Moradia')).toBeTruthy();
    expect(screen.getByText('Estabelecimento')).toBeTruthy();
    expect(screen.getByText('12 pedidos por mês')).toBeTruthy();
    expect(spendingApi.get).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
  });

  it('drops the "Até hoje" note for a past month and filters by account', async () => {
    const { container } = renderWithProviders(<SpendingScreen />, { windowId: '/spending' });
    await waitFor(() => expect(screen.getByText('Nubank', { selector: 'option' })).toBeTruthy());
    const [monthSelect, accountSelect] = Array.from(container.querySelectorAll('select'));

    fireEvent.change(monthSelect, { target: { value: previousKey } });
    fireEvent.change(accountSelect, { target: { value: 'a1' } });

    await waitFor(() =>
      expect(spendingApi.get).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' })
    );
    await waitFor(() => expect(screen.getByText(`Gastos de ${monthLabel(previousKey)} · Nubank`)).toBeTruthy());
    expect(screen.getByText(`Média mensal dos 3 meses anteriores: ${money(350000)}`)).toBeTruthy();
  });

  it('handles an empty month', async () => {
    jest.mocked(spendingApi.get).mockResolvedValue({
      monthExpenseCents: 0,
      averageExpenseCents: 0,
      byClass: [],
      byCategory: [],
      months: [],
      topMerchants: [],
      reducible: [],
      reduciblePotentialCents: 0,
    });
    const { container } = renderWithProviders(<SpendingScreen />, { windowId: '/spending' });
    await waitFor(() => expect(screen.getByText('Até hoje.')).toBeTruthy());
    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(screen.getByText(`${money(0)} em gastos dispensáveis`)).toBeTruthy();
    expect(screen.getAllByText('Nenhuma despesa neste mês.')).toHaveLength(2);
    expect(screen.getByText(/Nenhum gasto supérfluo ou variável relevante/)).toBeTruthy();
    expect(screen.queryByText(/pela média dos últimos meses/)).toBeNull();

    fireEvent.change(container.querySelector('select')!, { target: { value: previousKey } });
    await waitFor(() => expect(screen.getByText(`Gastos de ${monthLabel(previousKey)} · todas as contas`)).toBeTruthy());
    expect(screen.queryByText('Até hoje.')).toBeNull();
  });

  it('shows an error that can be retried', async () => {
    jest.mocked(spendingApi.get).mockRejectedValue(new Error('boom'));
    renderWithProviders(<SpendingScreen />, { windowId: '/spending' });
    await waitFor(() => expect(screen.getByText('Não foi possível carregar a análise')).toBeTruthy());

    jest.mocked(spendingApi.get).mockResolvedValue(analysis);
    fireEvent.click(screen.getByText('Tentar de novo'));
    await waitFor(() => expect(screen.getByText('Gasto no mês')).toBeTruthy());
  });
});

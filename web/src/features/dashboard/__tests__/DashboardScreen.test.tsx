import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { accountsApi } from '@/features/accounts/api';
import { transactionsApi } from '@/features/transactions/api';
import { goalsApi } from '@/features/goals/api';
import { useAuth } from '@/features/auth/AuthContext';
import { avoidableApi } from '@/features/avoidable/api';
import { emptyReport } from '@/features/avoidable/__tests__/fixtures';
import { DashboardScreen } from '../DashboardScreen';
import { summaryApi } from '../api';
import { CashFlowForecastDto, DailyBudgetDto, RecurringExpenseDto } from '../types';

jest.mock('../api');
jest.mock('@/features/accounts/api');
jest.mock('@/features/transactions/api');
jest.mock('@/features/goals/api');
jest.mock('@/features/avoidable/api');
jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));

const money = (cents: number, signed = false) => formatCents(cents, { signed }).replace(/\s+/g, ' ');

const accounts = [
  { id: 'a1', name: 'Nubank', balanceCents: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'a2', name: 'Inter', balanceCents: 0, createdAt: '2026-01-01T00:00:00Z' },
];

const summary = {
  totalIncomeCents: 500000,
  totalExpenseCents: 320000,
  balanceCents: 180000,
  byCategory: [],
};

const recurring: RecurringExpenseDto[] = [
  {
    name: 'Netflix', categoryName: 'Lazer', accountId: 'a1', accountName: 'Nubank',
    monthlyCents: 5590, lastDate: '2026-10-01T00:00:00Z', kind: 'SUBSCRIPTION', detected: true,
  },
  {
    name: 'Aluguel', categoryName: 'Moradia', accountId: 'a2', accountName: 'Inter',
    monthlyCents: 150000, lastDate: '2026-10-05T00:00:00Z', kind: 'FIXED', detected: false,
  },
];

const forecast: CashFlowForecastDto = {
  isCurrentMonth: true,
  remainingDays: 10,
  incomeSoFarCents: 500000,
  expenseSoFarCents: 320000,
  pendingIncomeCents: 0,
  pendingBillsCents: 25000,
  variableEstimateCents: 40000,
  projectedIncomeCents: 500000,
  projectedExpenseCents: 385000,
  projectedBalanceCents: 115000,
  upcoming: [{ kind: 'INSTALLMENT', name: 'Magazine', amountCents: 25000, expectedDate: '2026-10-28T12:00:00Z' }],
  nextIncome: null,
  installments: {
    monthlyCents: 25000,
    remainingCents: 150000,
    items: [
      {
        merchantId: 'm1', key: 'magazine', name: 'Magazine', amountCents: 25000, paid: 4, total: 10,
        remainingCents: 150000, lastDate: '2026-09-28T12:00:00Z', endsOn: '2027-04-28T12:00:00Z',
      },
    ],
  },
};

const daily: DailyBudgetDto = {
  isCurrentMonth: true,
  daysLeft: 10,
  monthlyGoalCents: 0,
  freeToSpendCents: 60000,
  todayAllowanceCents: 6000,
  spentTodayCents: 1000,
  leftTodayCents: 5000,
  hourValueCents: 0,
  workHoursPerMonth: 176,
  budgets: [
    {
      categoryId: 'c1', categoryName: 'Lazer', color: '#a00', limitCents: 10000, spentCents: 9000,
      percent: 0.9, level: 'WARNING', perDayLeftCents: 100,
    },
  ],
};

function txn(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, accountId: 'a1', accountName: 'Nubank', categoryId: 'c1', categoryName: 'Alimentação',
    type: 'EXPENSE', amountCents: 1000, description: `Compra ${id}`, date: '2026-10-03T15:00:00Z',
    recurrence: 'NONE', merchantId: null, merchantName: '', ...overrides,
  };
}

const goals = [
  { id: 'g1', name: 'Viagem', targetCents: 100000, currentCents: 42000, deadline: null, status: 'ACTIVE', progressPercent: 42 },
  { id: 'g2', name: 'Carro antigo', targetCents: 100, currentCents: 100, deadline: null, status: 'COMPLETED', progressPercent: 100 },
];

function setup() {
  jest.mocked(useAuth).mockReturnValue({ user: { name: 'Gustavo Fonseca', email: 'g@x.com' } } as never);
  jest.mocked(accountsApi.getAll).mockResolvedValue(accounts);
  jest.mocked(summaryApi.get).mockResolvedValue(summary);
  jest.mocked(summaryApi.recurring).mockResolvedValue(recurring);
  jest.mocked(summaryApi.forecast).mockResolvedValue(forecast);
  jest.mocked(summaryApi.daily).mockResolvedValue(daily);
  jest.mocked(transactionsApi.getAll).mockResolvedValue([
    txn('t1'),
    txn('t2', { type: 'INCOME', amountCents: 250000, description: '', categoryName: 'Salário' }),
    txn('t3'),
    txn('t4'),
    txn('t5'),
    txn('t6'),
  ] as never);
  jest.mocked(goalsApi.getAll).mockResolvedValue(goals as never);
  jest.mocked(avoidableApi.get).mockResolvedValue({ ...emptyReport, monthCents: 12300, yearProjectionCents: 147600 });
}

const currentKey = monthKeyOf(new Date());
const now = new Date();
const previousKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

describe('DashboardScreen', () => {
  beforeEach(setup);

  it('greets the user and shows the summary, recurring costs, goals and recent transactions', async () => {
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    expect(screen.getByText('Atualizando...')).toBeTruthy();
    expect(screen.getByText('Olá, Gustavo')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(money(180000, true))).toBeTruthy());
    expect(screen.getByText(money(500000))).toBeTruthy();
    expect(screen.getByText(money(320000))).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(`Resumo de ${monthLabel(currentKey)} · todas as contas`)).toBeTruthy()
    );

    expect(screen.getByText('Netflix')).toBeTruthy();
    expect(screen.getByText('Lazer · Nubank')).toBeTruthy();
    expect(screen.getByText('Moradia · Inter')).toBeTruthy();
    expect(screen.getByText('Assinatura')).toBeTruthy();
    expect(screen.getByText('Fixo')).toBeTruthy();
    expect(screen.getByTestId('icon-play-circle')).toBeTruthy();
    expect(screen.getByTestId('icon-repeat')).toBeTruthy();
    expect(screen.getByText('Total por mês')).toBeTruthy();
    expect(screen.getByText(money(-155590))).toBeTruthy();

    expect(screen.getByText('Metas ativas')).toBeTruthy();
    expect(screen.getByText('Viagem')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.queryByText('Carro antigo')).toBeNull();

    expect(screen.getByText('Compra t1')).toBeTruthy();
    expect(screen.getByText('Salário')).toBeTruthy();
    expect(screen.getByText(money(250000))).toBeTruthy();
    expect(screen.getAllByText(money(-1000))).toHaveLength(4);
    expect(screen.queryByText('Compra t6')).toBeNull();
    expect(screen.getAllByText(`${new Date('2026-10-03T15:00:00Z').toLocaleDateString('pt-BR')} · Nubank`)).toHaveLength(5);

    expect(summaryApi.get).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
    expect(summaryApi.recurring).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
    expect(summaryApi.forecast).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });

    expect(screen.getByText('Quanto posso gastar hoje')).toBeTruthy();
    expect(screen.getByText(money(5000))).toBeTruthy();
    expect(screen.getByText('Alertas de orçamento')).toBeTruthy();
    expect(screen.getByText(`Lazer: ${money(9000)} de ${money(10000)} (90%)`)).toBeTruthy();
    expect(summaryApi.daily).toHaveBeenCalledWith(monthRange(currentKey), expect.any(String));

    expect(screen.getByText('Previsão do mês')).toBeTruthy();
    expect(screen.getByText(money(115000))).toBeTruthy();
    expect(screen.getByText('Próximos lançamentos')).toBeTruthy();
    expect(screen.getByText('Parcelamentos')).toBeTruthy();
    expect(screen.getAllByText('Magazine')).toHaveLength(2);
    expect(screen.getByText(`Comprometido por mês · falta pagar ${money(150000)}`)).toBeTruthy();

    expect(screen.getByText('Gastos evitáveis')).toBeTruthy();
    expect(screen.getByText(money(12300))).toBeTruthy();
    expect(screen.getByText(`em gastos supérfluos neste mês · ${money(147600)} em 12 meses no ritmo atual`)).toBeTruthy();
    expect(screen.getByText('Ver gastos evitáveis')).toBeTruthy();
    expect(avoidableApi.get).toHaveBeenCalledWith({ ...monthRange(currentKey), accountId: undefined });
  });

  it('filters by month and account', async () => {
    const { container } = renderWithProviders(<DashboardScreen />, { windowId: '/' });
    await waitFor(() => expect(screen.getByText('Nubank', { selector: 'option' })).toBeTruthy());
    const [monthSelect, accountSelect] = Array.from(container.querySelectorAll('select'));

    fireEvent.change(monthSelect, { target: { value: previousKey } });
    await waitFor(() =>
      expect(summaryApi.get).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: undefined })
    );

    fireEvent.change(accountSelect, { target: { value: 'a1' } });
    await waitFor(() =>
      expect(transactionsApi.getAll).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' })
    );
    expect(summaryApi.recurring).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' });
    expect(summaryApi.forecast).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' });
    expect(avoidableApi.get).toHaveBeenCalledWith({ ...monthRange(previousKey), accountId: 'a1' });
    await waitFor(() => expect(screen.getByText(`Resumo de ${monthLabel(previousKey)} · Nubank`)).toBeTruthy());
    expect(screen.getByText('Lazer')).toBeTruthy();
    expect(screen.getByText('Moradia')).toBeTruthy();
  });

  it('shows an error with a retry that refetches everything', async () => {
    jest.mocked(summaryApi.get).mockRejectedValue(new Error('boom'));
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    await waitFor(() => expect(screen.getByText('Não foi possível carregar o resumo')).toBeTruthy());
    expect(summaryApi.get).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Tentar de novo'));
    await waitFor(() => expect(summaryApi.get).toHaveBeenCalledTimes(2));
    expect(transactionsApi.getAll).toHaveBeenCalledTimes(2);
    expect(summaryApi.recurring).toHaveBeenCalledTimes(2);
    expect(summaryApi.forecast).toHaveBeenCalledTimes(2);
    expect(summaryApi.daily).toHaveBeenCalledTimes(2);
    expect(goalsApi.getAll).toHaveBeenCalledTimes(2);
  });

  it('refreshes from the toolbar', async () => {
    renderWithProviders(<DashboardScreen />, { windowId: '/' });
    await waitFor(() => expect(screen.getByText('Viagem')).toBeTruthy());

    const toolbarButton = screen.getAllByRole('button').find((b) => within(b).queryByText('Atualizar'));
    fireEvent.click(toolbarButton!);
    await waitFor(() => expect(goalsApi.getAll).toHaveBeenCalledTimes(2));
    expect(summaryApi.forecast).toHaveBeenCalledTimes(2);
    expect(summaryApi.daily).toHaveBeenCalledTimes(2);
  });

  it('hides the forecast for a closed month and the installments when there are none', async () => {
    jest.mocked(summaryApi.forecast).mockResolvedValue({
      ...forecast,
      isCurrentMonth: false,
      installments: { monthlyCents: 0, remainingCents: 0, items: [] },
    });
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    await waitFor(() => expect(screen.getByText('Viagem')).toBeTruthy());
    await waitFor(() => expect(summaryApi.forecast).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Atualizando...')).toBeNull());
    expect(screen.queryByText('Previsão do mês')).toBeNull();
    expect(screen.queryByText('Parcelamentos')).toBeNull();
  });

  it('shows the empty states when there is nothing in the month', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: null } as never);
    jest.mocked(summaryApi.recurring).mockResolvedValue([]);
    jest.mocked(transactionsApi.getAll).mockResolvedValue([]);
    jest.mocked(goalsApi.getAll).mockResolvedValue([]);
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    await waitFor(() => expect(screen.getByText('Nenhuma transação neste mês')).toBeTruthy());
    expect(screen.getByText(/Nenhum custo fixo identificado ainda/)).toBeTruthy();
    expect(screen.queryByText('Metas ativas')).toBeNull();
    expect(screen.queryByText('Total por mês')).toBeNull();
    expect(screen.getByText('Olá,')).toBeTruthy();
  });

  it('keeps the status busy while the daily budget loads and hides its cards until then', async () => {
    jest.mocked(summaryApi.daily).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    await waitFor(() => expect(screen.getByText('Previsão do mês')).toBeTruthy());
    expect(screen.getByText('Atualizando...')).toBeTruthy();
    expect(screen.queryByText('Quanto posso gastar hoje')).toBeNull();
    expect(screen.queryByText('Alertas de orçamento')).toBeNull();
  });

  it('hides the avoidable spending card until it loads', async () => {
    jest.mocked(avoidableApi.get).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DashboardScreen />, { windowId: '/' });

    await waitFor(() => expect(screen.getByText('Viagem')).toBeTruthy());
    expect(screen.queryByText('Ver gastos evitáveis')).toBeNull();
  });

  it('handles a user without a name', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: { email: 'g@x.com' } } as never);
    renderWithProviders(<DashboardScreen />, { windowId: '/' });
    expect(screen.getByText('Olá,')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Viagem')).toBeTruthy());
  });
});

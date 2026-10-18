import React from 'react';
import { render, screen } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { longMonthOf } from '@/lib/periods';
import { BudgetAlerts } from '../components/BudgetAlerts';
import { DailyBudgetCard } from '../components/DailyBudgetCard';
import { ForecastCard } from '../components/ForecastCard';
import { Installments } from '../components/Installments';
import { BudgetStatusDto, CashFlowForecastDto, DailyBudgetDto, ForecastItemDto, InstallmentDto } from '../types';

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');
const shortDay = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const item = (overrides: Partial<ForecastItemDto>): ForecastItemDto => ({
  kind: 'BILL', name: 'Aluguel', amountCents: 150000, expectedDate: '2026-10-20T12:00:00Z', ...overrides,
});

const installment = (overrides: Partial<InstallmentDto>): InstallmentDto => ({
  merchantId: 'm1', key: 'magazine', name: 'Magazine', amountCents: 25000, paid: 3, total: 10,
  remainingCents: 175000, lastDate: '2026-10-10T12:00:00Z', endsOn: '2027-05-10T12:00:00Z', ...overrides,
});

const forecast = (overrides: Partial<CashFlowForecastDto>): CashFlowForecastDto => ({
  isCurrentMonth: true,
  remainingDays: 13,
  incomeSoFarCents: 500000,
  expenseSoFarCents: 200000,
  pendingIncomeCents: 100000,
  pendingBillsCents: 150000,
  variableEstimateCents: 80000,
  projectedIncomeCents: 600000,
  projectedExpenseCents: 430000,
  projectedBalanceCents: 170000,
  upcoming: [],
  nextIncome: null,
  installments: { monthlyCents: 0, remainingCents: 0, items: [] },
  ...overrides,
});

describe('ForecastCard', () => {
  it('renders nothing for a closed month', () => {
    const { container } = render(<ForecastCard forecast={forecast({ isCurrentMonth: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows a positive projection with the next income and the upcoming items', () => {
    const salary = item({ kind: 'INCOME', name: 'Salário', amountCents: 400000, expectedDate: '2026-10-25T12:00:00Z' });
    render(
      <ForecastCard
        forecast={forecast({
          nextIncome: salary,
          upcoming: [
            item({}),
            item({ kind: 'INSTALLMENT', name: 'Magazine 4/10', amountCents: 25000, expectedDate: '2026-10-22T12:00:00Z' }),
            salary,
          ],
        })}
      />
    );

    expect(screen.getByText('Previsão do mês')).toBeTruthy();
    expect(screen.getByText('Sobra prevista no fim do mês')).toBeTruthy();
    expect(screen.getByText(money(170000))).toBeTruthy();
    expect(
      screen.getByText(`Entradas previstas ${money(600000)} · saídas previstas ${money(430000)} · faltam 13 dias`)
    ).toBeTruthy();
    expect(screen.queryByText(/fecha no vermelho/)).toBeNull();
    expect(
      screen.getByText(
        `Próxima entrada: Salário em ${shortDay('2026-10-25T12:00:00Z')} (${money(400000)}). Inclui ${money(80000)} de gastos do dia a dia estimados pelo seu ritmo dos últimos meses.`
      )
    ).toBeTruthy();

    expect(screen.getByText('Próximos lançamentos')).toBeTruthy();
    expect(screen.getByText('Aluguel')).toBeTruthy();
    expect(screen.getByText('Conta fixa')).toBeTruthy();
    expect(screen.getByText(money(-150000))).toBeTruthy();
    expect(screen.getByText('Magazine 4/10')).toBeTruthy();
    expect(screen.getByText('Parcela')).toBeTruthy();
    expect(screen.getByText(money(-25000))).toBeTruthy();
    expect(screen.getByText('Salário')).toBeTruthy();
    expect(screen.getByText('Entrada')).toBeTruthy();
    expect(screen.getByText(money(400000))).toBeTruthy();
    expect(screen.getByText(shortDay('2026-10-20T12:00:00Z'))).toBeTruthy();
  });

  it('warns about a negative projection without income ahead and a single remaining day', () => {
    render(<ForecastCard forecast={forecast({ projectedBalanceCents: -32000, remainingDays: 1 })} />);

    expect(screen.getByText(money(-32000))).toBeTruthy();
    expect(screen.getByText(/· faltam 1 dia$/)).toBeTruthy();
    expect(
      screen.getByText('No ritmo atual o mês fecha no vermelho. Segure os gastos do dia a dia até a próxima entrada.')
    ).toBeTruthy();
    expect(screen.getByTestId('icon-exclamation-triangle')).toBeTruthy();
    expect(screen.getByText(/^Nenhuma entrada prevista até o fim do mês\. Inclui/)).toBeTruthy();
    expect(screen.queryByText('Próximos lançamentos')).toBeNull();
  });

  it('lists at most six upcoming items', () => {
    const upcoming = Array.from({ length: 8 }, (_, i) =>
      item({ name: `Conta ${i}`, expectedDate: `2026-10-${String(20 + i).padStart(2, '0')}T12:00:00Z` })
    );
    render(<ForecastCard forecast={forecast({ upcoming })} />);

    expect(screen.getByText('Conta 0')).toBeTruthy();
    expect(screen.getByText('Conta 5')).toBeTruthy();
    expect(screen.queryByText('Conta 6')).toBeNull();
    expect(screen.queryByText('Conta 7')).toBeNull();
    expect(screen.getAllByText('Conta fixa')).toHaveLength(6);
  });
});

describe('Installments', () => {
  it('renders nothing without installments', () => {
    const { container } = render(<Installments installments={{ monthlyCents: 0, remainingCents: 0, items: [] }} />);
    expect(container.innerHTML).toBe('');
  });

  it('lists each installment with its progress and the monthly total', () => {
    render(
      <Installments
        installments={{
          monthlyCents: 37000,
          remainingCents: 211000,
          items: [
            installment({}),
            installment({ merchantId: null, key: 'loja', name: 'Loja', amountCents: 12000, paid: 9, total: 12, remainingCents: 36000, endsOn: '2027-01-15T12:00:00Z' }),
          ],
        }}
      />
    );

    expect(screen.getByText('Parcelamentos')).toBeTruthy();
    expect(screen.getByText('Magazine')).toBeTruthy();
    expect(
      screen.getByText(`3 de 10 pagas · termina em ${longMonthOf('2027-05-10T12:00:00Z')} · falta ${money(175000)}`)
    ).toBeTruthy();
    expect(screen.getByText(money(-25000))).toBeTruthy();
    expect(screen.getByText('Loja')).toBeTruthy();
    expect(
      screen.getByText(`9 de 12 pagas · termina em ${longMonthOf('2027-01-15T12:00:00Z')} · falta ${money(36000)}`)
    ).toBeTruthy();
    expect(screen.getByText(money(-12000))).toBeTruthy();
    expect(screen.getByText(`Comprometido por mês · falta pagar ${money(211000)}`)).toBeTruthy();
    expect(screen.getByText(money(-37000))).toBeTruthy();
  });
});

const daily = (overrides: Partial<DailyBudgetDto>): DailyBudgetDto => ({
  isCurrentMonth: true,
  daysLeft: 10,
  monthlyGoalCents: 100000,
  freeToSpendCents: 90000,
  todayAllowanceCents: 9000,
  spentTodayCents: 2000,
  leftTodayCents: 7000,
  hourValueCents: 3125,
  workHoursPerMonth: 160,
  budgets: [],
  ...overrides,
});

const NO_ROOM = /Sem folga neste mês/;
const OVER = 'O que passar de hoje diminui o limite dos próximos dias.';

describe('DailyBudgetCard', () => {
  it('renders nothing for a closed month', () => {
    const { container } = render(<DailyBudgetCard daily={daily({ isCurrentMonth: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows what is left today with the goal, the days left and the hour value', () => {
    render(<DailyBudgetCard daily={daily({})} />);

    expect(screen.getByText('Quanto posso gastar hoje')).toBeTruthy();
    expect(screen.getByText('Ainda pode gastar hoje')).toBeTruthy();
    expect(screen.getByText(money(7000))).toBeTruthy();
    expect(
      screen.getByText(
        `Limite de hoje ${money(9000)} · gasto hoje ${money(2000)} · ${money(90000)} livres até o fim do mês (10 dias contando hoje), já descontando as contas fixas e a meta de economia de ${money(100000)}.`
      )
    ).toBeTruthy();
    expect(screen.getByText(`Sua hora de trabalho vale ${money(3125)} (renda média ÷ 160 h por mês).`)).toBeTruthy();
    expect(screen.queryByText(NO_ROOM)).toBeNull();
    expect(screen.queryByText(OVER)).toBeNull();
  });

  it('warns when today went over the limit, without a goal or hour value, on the last day', () => {
    render(
      <DailyBudgetCard
        daily={daily({ daysLeft: 1, monthlyGoalCents: 0, hourValueCents: 0, freeToSpendCents: 1000, spentTodayCents: 5000, leftTodayCents: -4000 })}
      />
    );

    expect(screen.getByText('Passou do limite de hoje em')).toBeTruthy();
    expect(screen.getByText(money(4000))).toBeTruthy();
    expect(screen.getByText(/livres até o fim do mês \(só hoje\), já descontando as contas fixas\.$/)).toBeTruthy();
    expect(screen.getByText(OVER)).toBeTruthy();
    expect(screen.queryByText(NO_ROOM)).toBeNull();
    expect(screen.queryByText(/Sua hora de trabalho/)).toBeNull();
  });

  it('warns that there is no room in the month and never shows a negative free amount', () => {
    render(<DailyBudgetCard daily={daily({ freeToSpendCents: -5000, spentTodayCents: 3000, leftTodayCents: -3000 })} />);

    expect(screen.getByText(NO_ROOM)).toBeTruthy();
    expect(screen.queryByText(OVER)).toBeNull();
    expect(screen.getByText((text) => text.includes(`· ${money(0)} livres até o fim do mês`))).toBeTruthy();
  });
});

const status = (overrides: Partial<BudgetStatusDto>): BudgetStatusDto => ({
  categoryId: 'c1',
  categoryName: 'Mercado',
  color: '#0a0',
  limitCents: 80000,
  spentCents: 20000,
  percent: 0.25,
  level: 'OK',
  perDayLeftCents: 6000,
  ...overrides,
});

describe('BudgetAlerts', () => {
  it('renders nothing when every budget is fine', () => {
    const { container } = render(<BudgetAlerts budgets={[status({})]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing without budgets', () => {
    const { container } = render(<BudgetAlerts budgets={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('lists the budgets close to the limit and the exceeded ones', () => {
    render(
      <BudgetAlerts
        budgets={[
          status({}),
          status({ categoryId: 'c2', categoryName: 'Lazer', spentCents: 68000, percent: 0.85, level: 'WARNING', perDayLeftCents: 1200 }),
          status({ categoryId: 'c3', categoryName: 'Delivery', limitCents: 20000, spentCents: 30000, percent: 1.5, level: 'EXCEEDED' }),
        ]}
      />
    );

    expect(screen.getByText('Alertas de orçamento')).toBeTruthy();
    expect(screen.queryByText(/^Mercado:/)).toBeNull();
    expect(screen.getByText(`Lazer: ${money(68000)} de ${money(80000)} (85%)`)).toBeTruthy();
    expect(screen.getByText(`Chegando no limite: dá para gastar ${money(1200)} por dia até o fim do mês.`)).toBeTruthy();
    expect(screen.getByTestId('icon-exclamation-circle')).toBeTruthy();
    expect(screen.getByText(`Delivery: ${money(30000)} de ${money(20000)} (150%)`)).toBeTruthy();
    expect(
      screen.getByText(`Limite estourado em ${money(10000)}. Evite novos gastos nesta categoria até o fim do mês.`)
    ).toBeTruthy();
    expect(screen.getByTestId('icon-times-circle')).toBeTruthy();
  });
});

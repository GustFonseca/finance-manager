import React from 'react';
import { render, screen } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { longMonthOf } from '@/lib/periods';
import { ForecastCard } from '../components/ForecastCard';
import { Installments } from '../components/Installments';
import { CashFlowForecastDto, ForecastItemDto, InstallmentDto } from '../types';

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

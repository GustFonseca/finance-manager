import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { DigestCard } from '../components/DigestCard';
import { DigestDto, DigestPeriodDto } from '../types';

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

const period = (overrides: Partial<DigestPeriodDto>): DigestPeriodDto => ({
  start: '2026-10-12T03:00:00Z',
  end: '2026-10-18T03:00:00Z',
  spentCents: 0,
  previousSpentCents: 0,
  changePercent: null,
  incomeCents: 0,
  savedCents: 0,
  superfluousCents: 0,
  topMerchant: null,
  topIncrease: null,
  ...overrides,
});

const digest = (overrides: Partial<DigestDto>): DigestDto => ({
  week: period({}),
  month: period({}),
  goals: [],
  ...overrides,
});

const goals = [
  { name: 'Viagem', percent: 42, missingCents: 58000 },
  { name: 'Reserva', percent: 80, missingCents: 20000 },
  { name: 'Notebook', percent: 10, missingCents: 450000 },
  { name: 'Carro', percent: 5, missingCents: 3000000 },
];

describe('DigestCard', () => {
  it('renders nothing without spending and without goals', () => {
    const { container } = render(<DigestCard digest={digest({})} />);
    expect(container.innerHTML).toBe('');
  });

  it('summarizes the week with the comparison, the highlights and the goals', () => {
    render(
      <DigestCard
        digest={digest({
          week: period({
            spentCents: 41000,
            changePercent: -12.4,
            incomeCents: 100000,
            savedCents: 59000,
            superfluousCents: 8000,
            topMerchant: { name: 'Mercado', cents: 15000, previousCents: 9000 },
            topIncrease: { name: 'iFood', cents: 9000, previousCents: 3000 },
          }),
          goals,
        })}
      />
    );

    expect(screen.getByText('Resumo')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Semana' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText(`Você gastou ${money(41000)}`)).toBeTruthy();
    expect(screen.getByText('−12% em relação à semana anterior')).toBeTruthy();
    expect(screen.getByText(`Entrou ${money(100000)} · sobrou ${money(59000)}`)).toBeTruthy();
    expect(screen.getByText(`${money(8000)} em supérfluos`)).toBeTruthy();
    expect(screen.getByText(`Maior gasto: Mercado (${money(15000)})`)).toBeTruthy();
    expect(screen.getByText(`Maior aumento: iFood, ${money(9000)} (antes ${money(3000)})`)).toBeTruthy();
    expect(screen.getByText('Viagem')).toBeTruthy();
    expect(screen.getByText(`faltam ${money(58000)}`)).toBeTruthy();
    expect(screen.getByText('Notebook')).toBeTruthy();
    expect(screen.queryByText('Carro')).toBeNull();
  });

  it('switches to the month and omits what is missing', () => {
    render(
      <DigestCard
        digest={digest({
          week: period({ spentCents: 1000, changePercent: 30 }),
          month: period({ spentCents: 320000, incomeCents: 250000, savedCents: -70000 }),
        })}
      />
    );

    expect(screen.getByText('+30% em relação à semana anterior')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Mês' }));

    expect(screen.getByRole('radio', { name: 'Mês' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText(`Você gastou ${money(320000)}`)).toBeTruthy();
    expect(screen.queryByText(/em relação/)).toBeNull();
    expect(screen.getByText(`Entrou ${money(250000)} · faltou ${money(70000)}`)).toBeTruthy();
    expect(screen.queryByText(/em supérfluos/)).toBeNull();
    expect(screen.queryByText(/Maior gasto/)).toBeNull();
    expect(screen.queryByText(/Maior aumento/)).toBeNull();
    expect(screen.queryByText(/faltam/)).toBeNull();
  });

  it('compares the month with the same stretch of the previous month', () => {
    render(<DigestCard digest={digest({ month: period({ spentCents: 5000, changePercent: 8 }) })} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Mês' }));

    expect(screen.getByText('+8% em relação ao mesmo período do mês anterior')).toBeTruthy();
  });

  it('shows the goals even when nothing was spent', () => {
    render(<DigestCard digest={digest({ goals: goals.slice(0, 1) })} />);

    expect(screen.getByText(`Você gastou ${money(0)}`)).toBeTruthy();
    expect(screen.getByText('Viagem')).toBeTruthy();
  });
});

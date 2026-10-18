import React from 'react';
import './matchMedia';
import { fireEvent, render, screen } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { shortMonthOf } from '@/lib/periods';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { ClassSplit } from '../components/ClassSplit';
import { MonthlyTrend } from '../components/MonthlyTrend';
import { ReducibleList } from '../components/ReducibleList';
import { TopMerchants } from '../components/TopMerchants';
import { classInfo, SPENDING_CLASSES } from '../classes';

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

describe('classInfo', () => {
  it('finds the class by value', () => {
    expect(classInfo('ESSENTIAL').label).toBe('Essencial');
    expect(classInfo('SUPERFLUOUS').label).toBe('Supérfluo');
  });

  it('falls back to "Variável" for an unknown class', () => {
    expect(classInfo('OTHER' as never)).toBe(SPENDING_CLASSES[1]);
  });
});

describe('CategoryBreakdown', () => {
  it('shows an empty message', () => {
    render(<CategoryBreakdown categories={[]} />);
    expect(screen.getByText('Nenhuma despesa neste mês.')).toBeTruthy();
  });

  it('lists categories with share and average', () => {
    render(
      <CategoryBreakdown
        categories={[
          { categoryId: 'c1', categoryName: 'Moradia', color: '#000', cents: 200000, share: 0.5, averageCents: 190000, class: 'ESSENTIAL' },
          { categoryId: 'c2', categoryName: 'Delivery', color: '#000', cents: 60000, share: 0.151, averageCents: 0, class: 'SUPERFLUOUS' },
        ]}
      />
    );
    expect(screen.getByText('Moradia')).toBeTruthy();
    expect(screen.getByText(`${money(200000)} · 50%`)).toBeTruthy();
    expect(screen.getByText(`média ${money(190000)}`)).toBeTruthy();
    expect(screen.getByText(`${money(60000)} · 15%`)).toBeTruthy();
    expect(screen.getByText('sem média')).toBeTruthy();
    expect(screen.getByText('Essencial')).toBeTruthy();
  });
});

describe('ClassSplit', () => {
  it('shows each class with value and share, defaulting missing ones to zero', () => {
    render(<ClassSplit totals={[{ class: 'ESSENTIAL', cents: 240000, share: 0.6 }]} />);
    expect(screen.getByText(`${money(240000)} · 60%`)).toBeTruthy();
    expect(screen.getAllByText(`${money(0)} · 0%`)).toHaveLength(2);
    expect(screen.getByText('Variável')).toBeTruthy();
  });
});

describe('MonthlyTrend', () => {
  const months = [
    { monthStart: '2026-09-01T03:00:00Z', essentialCents: 230000, variableCents: 90000, superfluousCents: 50000 },
    { monthStart: '2026-10-01T03:00:00Z', essentialCents: 240000, variableCents: 100000, superfluousCents: 60000 },
  ];

  it('toggles between chart and table', () => {
    render(<MonthlyTrend months={months} />);
    expect(screen.queryByText('Mês')).toBeNull();
    expect(screen.getByText(shortMonthOf(months[0].monthStart))).toBeTruthy();

    fireEvent.click(screen.getByText('Ver como tabela'));
    expect(screen.getByText('Mês')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText(money(230000))).toBeTruthy();
    expect(screen.getByText(money(90000))).toBeTruthy();
    expect(screen.getByText(money(50000))).toBeTruthy();
    expect(screen.getByText(money(370000))).toBeTruthy();
    expect(screen.getByText(money(400000))).toBeTruthy();

    fireEvent.click(screen.getByText('Ver gráfico'));
    expect(screen.queryByText('Mês')).toBeNull();
    expect(screen.getByText('Ver como tabela')).toBeTruthy();
  });
});

describe('TopMerchants', () => {
  it('shows an empty message', () => {
    render(<TopMerchants merchants={[]} />);
    expect(screen.getByText('Nenhuma despesa neste mês.')).toBeTruthy();
  });

  it('lists the merchants with kind, count and total', () => {
    render(
      <TopMerchants
        merchants={[
          {
            merchantId: 'm1', name: 'iFood', kind: 'MERCHANT', categoryName: 'Delivery', color: '#000', count: 12,
            cents: 60000, share: 0.15, averageTicketCents: 5000, lastDate: '2026-10-10T00:00:00Z', class: 'SUPERFLUOUS',
          } as never,
        ]}
      />
    );
    expect(screen.getByText('Estabelecimento')).toBeTruthy();
    expect(screen.getByText('iFood')).toBeTruthy();
    expect(screen.getByText('Delivery')).toBeTruthy();
    expect(screen.getByText('Supérfluo')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText(money(60000))).toBeTruthy();
  });
});

describe('ReducibleList', () => {
  it('shows an empty message', () => {
    render(<ReducibleList items={[]} />);
    expect(screen.getByText(/As sugestões aparecem quando um hábito passa de R\$ 50 por mês/)).toBeTruthy();
  });

  it('lists what can be reduced', () => {
    render(
      <ReducibleList
        items={[
          {
            merchantId: null, name: 'Uber', categoryId: 'c3', subscription: false, class: 'VARIABLE',
            timesPerMonth: 8, monthlyCents: 32000, potentialCents: 12000, detail: '8 corridas por mês',
          },
        ]}
      />
    );
    expect(screen.getByText('· Variável')).toBeTruthy();
    expect(screen.getByText('8 corridas por mês')).toBeTruthy();
    expect(screen.getByText(`${money(12000)}/mês`)).toBeTruthy();
  });
});

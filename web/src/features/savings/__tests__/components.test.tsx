import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { formatCents } from '@/lib/money';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetTable } from '../components/BudgetTable';
import { SuggestionList } from '../components/SuggestionList';
import { CategoryBudgetDto, SuggestionKind } from '../types';

const money = (cents: number) => formatCents(cents).replace(/\s+/g, ' ');

const budget = (overrides: Partial<CategoryBudgetDto>): CategoryBudgetDto => ({
  categoryId: 'c1', categoryName: 'Mercado', color: '#0a0', limitCents: 80000, spentCents: 40000,
  averageCents: 75000, suggestedLimitCents: 70000, essential: false, ...overrides,
});

describe('BudgetTable', () => {
  it('shows usage, overspending and categories without a limit', () => {
    const onEdit = jest.fn();
    render(
      <BudgetTable
        budgets={[
          budget({ categoryId: 'c1', categoryName: 'Mercado', spentCents: 20000, limitCents: 80000 }),
          budget({ categoryId: 'c2', categoryName: 'Lazer', spentCents: 90000, limitCents: 80000 }),
          budget({ categoryId: 'c3', categoryName: 'Delivery', limitCents: null }),
        ]}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Categoria')).toBeTruthy();
    expect(screen.getByText('25% usado')).toBeTruthy();
    expect(screen.getByText(`Estourado em ${money(10000)}`)).toBeTruthy();
    expect(screen.getByText('definir…')).toBeTruthy();
    expect(screen.queryByText('essencial')).toBeNull();

    fireEvent.click(screen.getByText('Lazer'));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c2' }));
  });
});

describe('BudgetForm', () => {
  it('renders nothing without a budget', () => {
    render(<BudgetForm budget={null} onClose={jest.fn()} onSubmit={jest.fn()} />);
    expect(screen.queryByText('Salvar')).toBeNull();
  });
});

describe('SuggestionList', () => {
  const kinds: [SuggestionKind, string][] = [
    ['GOAL', 'flag'],
    ['BUDGET', 'exclamation-triangle'],
    ['SUBSCRIPTION', 'play-circle'],
    ['CATEGORY', 'scissors'],
    ['HABIT', 'shopping-cart'],
    ['ORGANIZE', 'tags'],
  ];

  it('shows an icon per kind and the savings except for goals or zero', () => {
    render(
      <SuggestionList
        historyMonths={3}
        suggestions={[
          ...kinds.map(([kind]) => ({ kind, title: `T ${kind}`, detail: `D ${kind}`, potentialCents: 1000 })),
          { kind: 'HABIT', title: 'Sem economia', detail: 'nada', potentialCents: 0 },
        ]}
      />
    );
    kinds.forEach(([kind, icon]) => {
      expect(screen.getByText(`T ${kind}`)).toBeTruthy();
      expect(screen.getAllByTestId(`icon-${icon}`).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(`${money(1000)}/mês`)).toHaveLength(5);
  });
});

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useWindowManager } from '@/components/xp';
import { formatCents, INVALID_AMOUNT_MESSAGE } from '@/lib/money';
import { renderWithProviders } from '@/test/render';
import { BudgetForm } from '../components/BudgetForm';
import { BudgetTable } from '../components/BudgetTable';
import { SavingsGoalForm } from '../components/SavingsGoalForm';
import { SuggestionList } from '../components/SuggestionList';
import { INVALID_HOURS_MESSAGE, MAX_WORK_HOURS, WorkHoursForm } from '../components/WorkHoursForm';
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

  it('explains an invalid limit and clears it when the budget changes', () => {
    const onSubmit = jest.fn();
    const { rerender } = render(<BudgetForm budget={budget({})} onClose={jest.fn()} onSubmit={onSubmit} />);
    const input = () => screen.getByPlaceholderText('ex: 800,00') as HTMLInputElement;

    fireEvent.change(input(), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <BudgetForm budget={budget({ categoryId: 'c2', limitCents: null })} onClose={jest.fn()} onSubmit={onSubmit} />
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input().value).toBe('');

    fireEvent.change(input(), { target: { value: '500,00' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(50000);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('SavingsGoalForm', () => {
  it('explains an invalid amount, submits a valid one and resets on reopen', () => {
    const onSubmit = jest.fn();
    const props = { currentCents: 0, averageSavedCents: 30000, onClose: jest.fn(), onSubmit };
    const { rerender } = render(<SavingsGoalForm visible {...props} />);
    const input = () => screen.getByPlaceholderText('ex: 1000,00') as HTMLInputElement;

    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert').textContent).toBe(INVALID_AMOUNT_MESSAGE);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input(), { target: { value: '1000,00' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(100000);
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.change(input(), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<SavingsGoalForm visible={false} {...props} />);
    rerender(<SavingsGoalForm visible {...props} currentCents={50000} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input().value).toBe('500,00');
  });
});

describe('WorkHoursForm', () => {
  it('starts with the current hours, rejects invalid ones and resets on reopen', () => {
    const onSubmit = jest.fn();
    const props = { currentHours: 176, onClose: jest.fn(), onSubmit };
    const { rerender } = render(<WorkHoursForm visible {...props} />);
    const input = () => screen.getByPlaceholderText('ex: 176') as HTMLInputElement;

    expect(screen.getByText('Horas de trabalho')).toBeTruthy();
    expect(input().value).toBe('176');

    for (const value of ['', 'abc', '10,5', '0', String(MAX_WORK_HOURS + 1), '-3']) {
      fireEvent.change(input(), { target: { value } });
      fireEvent.click(screen.getByText('Salvar'));
      expect(screen.getByRole('alert').textContent).toBe(INVALID_HOURS_MESSAGE);
    }
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input(), { target: { value: ` ${MAX_WORK_HOURS} ` } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(onSubmit).toHaveBeenCalledWith(MAX_WORK_HOURS);
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.change(input(), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<WorkHoursForm visible={false} {...props} />);
    rerender(<WorkHoursForm visible {...props} currentHours={1} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input().value).toBe('1');
  });

  it('closes on cancel', () => {
    const onClose = jest.fn();
    render(<WorkHoursForm visible currentHours={160} onClose={onClose} onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
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
    renderWithProviders(
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
    expect(screen.getAllByText('Abrir Estabelecimentos')).toHaveLength(1);
  });

  it('opens the merchants window from an organize suggestion', () => {
    let wm: ReturnType<typeof useWindowManager> | undefined;
    function Probe() {
      wm = useWindowManager();
      return null;
    }
    renderWithProviders(
      <>
        <Probe />
        <SuggestionList
          historyMonths={3}
          suggestions={[{ kind: 'ORGANIZE', title: 'Organize', detail: 'sem categoria', potentialCents: 0 }]}
        />
      </>
    );
    expect(wm!.openWindows).not.toContain('/merchants');

    act(() => {
      fireEvent.click(screen.getByText('Abrir Estabelecimentos'));
    });

    expect(wm!.openWindows).toContain('/merchants');
    expect(wm!.activeWindow).toBe('/merchants');
  });

  it('explains why there are no suggestions', () => {
    const { rerender } = renderWithProviders(<SuggestionList historyMonths={0} suggestions={[]} />);
    expect(screen.getByText(/Importe os extratos desses meses/)).toBeTruthy();

    rerender(<SuggestionList historyMonths={3} suggestions={[]} />);
    expect(screen.getByText(/Nenhum ajuste necessário/)).toBeTruthy();
  });
});

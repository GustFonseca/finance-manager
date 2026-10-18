import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { formatCents } from '@/lib/money';
import { monthKeyOf, monthRange } from '@/lib/periods';
import { SavingsScreen } from '../SavingsScreen';
import { savingsApi } from '../api';
import { SavingsPlanDto } from '../types';

jest.mock('../api');

const money = (cents: number, signed = false) => formatCents(cents, { signed }).replace(/\s+/g, ' ');

const plan: SavingsPlanDto = {
  monthlyGoalCents: 100000,
  monthIncomeCents: 500000,
  monthExpenseCents: 440000,
  monthSavedCents: 60000,
  averageSavedCents: 80000,
  historyMonths: 3,
  monthProgress: 0.5,
  budgets: [
    {
      categoryId: 'c1', categoryName: 'Mercado', color: '#0a0', limitCents: 80000, spentCents: 40000,
      averageCents: 75000, suggestedLimitCents: 70000, essential: true,
    },
    {
      categoryId: 'c2', categoryName: 'Delivery', color: '#a00', limitCents: null, spentCents: 30000,
      averageCents: 25000, suggestedLimitCents: 0, essential: false,
    },
  ],
  suggestions: [
    { kind: 'SUBSCRIPTION', title: 'Cancele a Netflix', detail: 'Pouco usada', potentialCents: 5590 },
  ],
  potentialSavingsCents: 5590,
};

const month = monthRange(monthKeyOf(new Date()));

function toolbar(label: string) {
  return screen.getAllByRole('button').find((b) => within(b).queryByText(label) && b.textContent === label)!;
}

beforeEach(() => {
  jest.mocked(savingsApi.get).mockResolvedValue(plan);
  jest.mocked(savingsApi.setGoal).mockResolvedValue(undefined);
  jest.mocked(savingsApi.setBudget).mockResolvedValue(undefined);
  jest.mocked(savingsApi.applySuggested).mockResolvedValue(4);
});

describe('SavingsScreen', () => {
  it('shows the goal progress, figures, analysis and budgets', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });

    expect(screen.getByText('Analisando...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Economizado até agora:')).toBeTruthy());
    expect(savingsApi.get).toHaveBeenCalledWith(month);
    expect(screen.getByText('50% do mês concluído')).toBeTruthy();
    expect(screen.getByText(money(60000, true))).toBeTruthy();
    expect(screen.getByText(`de ${money(100000)}`)).toBeTruthy();
    expect(screen.getByText('Receitas no mês')).toBeTruthy();
    expect(screen.getByText('Despesas no mês')).toBeTruthy();
    expect(screen.getByText('Média economizada (3 meses)')).toBeTruthy();
    expect(screen.getByText(money(5590))).toBeTruthy();
    expect(screen.queryByText(/dos 3 meses anteriores têm transações/)).toBeNull();
    expect(screen.getByText('Cancele a Netflix')).toBeTruthy();
    expect(screen.getByText('Mercado')).toBeTruthy();
    expect(screen.getByText('essencial')).toBeTruthy();
    expect(screen.getByText('50% usado')).toBeTruthy();
    expect(screen.getByText('definir…')).toBeTruthy();
  });

  it('asks for a goal when there is none and warns about a short history', async () => {
    jest.mocked(savingsApi.get).mockResolvedValue({
      ...plan,
      monthlyGoalCents: 0,
      historyMonths: 1,
      potentialSavingsCents: 0,
      suggestions: [],
    });
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });

    await waitFor(() => expect(screen.getByText(/Defina quanto quer economizar por mês/)).toBeTruthy());
    expect(screen.getByText('Média economizada (1 mês)')).toBeTruthy();
    expect(screen.getByText(/Só 1 dos 3 meses anteriores têm transações/)).toBeTruthy();
    expect(screen.queryByText(/Você pode economizar até/)).toBeNull();
    expect(screen.getByText('Nenhum ajuste necessário: seus gastos estão dentro do esperado.')).toBeTruthy();
  });

  it('explains that there is no history to compare', async () => {
    jest.mocked(savingsApi.get).mockResolvedValue({ ...plan, historyMonths: 0, suggestions: [] });
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });

    await waitFor(() => expect(screen.getByText(/Não há transações nos 3 meses anteriores/)).toBeTruthy());
    expect(screen.getByText('Média economizada (0 meses)')).toBeTruthy();
    expect(screen.queryByText(/dos 3 meses anteriores têm transações/)).toBeNull();
  });

  it('shows an error that can be retried', async () => {
    jest.mocked(savingsApi.get).mockRejectedValue(new Error('boom'));
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });

    await waitFor(() => expect(screen.getByText('Não foi possível carregar o plano')).toBeTruthy());
    expect(screen.getByText('0% do mês concluído')).toBeTruthy();
    jest.mocked(savingsApi.get).mockResolvedValue(plan);
    fireEvent.click(screen.getByText('Tentar de novo'));
    await waitFor(() => expect(screen.getByText('Economizado até agora:')).toBeTruthy());
  });

  it('sets the monthly goal', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Economizado até agora:')).toBeTruthy());

    fireEvent.click(toolbar('Definir meta'));
    expect(screen.getByText('Meta de economia')).toBeTruthy();
    expect(screen.getByText(`Nos últimos 3 meses você economizou, em média, ${money(80000)} por mês.`)).toBeTruthy();
    const input = screen.getByPlaceholderText('ex: 1000,00') as HTMLInputElement;
    expect(input.value).toBe('1.000,00');

    fireEvent.change(input, { target: { value: '1.500,50' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(savingsApi.setGoal).toHaveBeenCalledWith(150050));
    await waitFor(() => expect(screen.queryByText('Meta de economia')).toBeNull());
    expect(savingsApi.get).toHaveBeenCalledTimes(2);
  });

  it('reports a failure to save the goal and ignores invalid amounts', async () => {
    jest.mocked(savingsApi.setGoal).mockRejectedValue(new Error('boom'));
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Economizado até agora:')).toBeTruthy());

    fireEvent.click(toolbar('Definir meta'));
    const input = screen.getByPlaceholderText('ex: 1000,00');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Salvar'));
    expect(savingsApi.setGoal).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(screen.getByText('Não foi possível salvar a meta')).toBeTruthy());
  });

  it('closes the goal form on cancel', async () => {
    jest.mocked(savingsApi.get).mockResolvedValue({ ...plan, monthlyGoalCents: 0 });
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText(/Defina quanto quer economizar/)).toBeTruthy());

    fireEvent.click(toolbar('Definir meta'));
    expect((screen.getByPlaceholderText('ex: 1000,00') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Meta de economia')).toBeNull());
  });

  it('edits a category budget, using the suggestion', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(screen.getByText('Mercado'));
    expect(screen.getByText('Orçamento — Mercado')).toBeTruthy();
    expect(screen.getByText(`Gasto neste mês: ${money(40000)} · Média: ${money(75000)}`)).toBeTruthy();
    const input = screen.getByPlaceholderText('ex: 800,00') as HTMLInputElement;
    expect(input.value).toBe('800,00');

    fireEvent.click(screen.getByText(`Usar sugerido (${money(70000)})`));
    expect(input.value).toBe('700,00');
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(savingsApi.setBudget).toHaveBeenCalledWith('c1', 70000));
    await waitFor(() => expect(screen.queryByText('Orçamento — Mercado')).toBeNull());
  });

  it('removes a budget limit', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(screen.getByText('Mercado'));
    fireEvent.click(screen.getByText('Remover limite'));
    await waitFor(() => expect(savingsApi.setBudget).toHaveBeenCalledWith('c1', null));
  });

  it('sets a budget for a category without a limit and reports failures', async () => {
    jest.mocked(savingsApi.setBudget).mockRejectedValue(new Error('boom'));
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Delivery')).toBeTruthy());

    fireEvent.click(screen.getByText('Delivery'));
    const input = screen.getByPlaceholderText('ex: 800,00') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.queryByText(/Usar sugerido/)).toBeNull();
    expect(screen.queryByText('Remover limite')).toBeNull();

    fireEvent.click(screen.getByText('Salvar'));
    expect(savingsApi.setBudget).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '300' } });
    fireEvent.click(screen.getByText('Salvar'));
    await waitFor(() => expect(screen.getByText('Não foi possível salvar o limite')).toBeTruthy());
    expect(savingsApi.setBudget).toHaveBeenCalledWith('c2', 30000);
  });

  it('closes the budget form on cancel', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(screen.getByText('Mercado'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Orçamento — Mercado')).toBeNull());
  });

  it('applies the suggested limits after confirming', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(toolbar('Aplicar limites sugeridos'));
    expect(screen.getByText(/Definir o limite de cada categoria com o valor sugerido/)).toBeTruthy();
    fireEvent.click(screen.getByText('Aplicar'));
    await waitFor(() => expect(screen.getByText('4 limite(s) definido(s).')).toBeTruthy());
    expect(savingsApi.applySuggested).toHaveBeenCalledWith(month);
  });

  it('does nothing when the confirmation is cancelled', async () => {
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(toolbar('Aplicar limites sugeridos'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText(/Definir o limite de cada categoria/)).toBeNull());
    expect(savingsApi.applySuggested).not.toHaveBeenCalled();
  });

  it('reports a failure to apply the suggested limits', async () => {
    jest.mocked(savingsApi.applySuggested).mockRejectedValue(new Error('boom'));
    renderWithProviders(<SavingsScreen />, { windowId: '/savings' });
    await waitFor(() => expect(screen.getByText('Mercado')).toBeTruthy());

    fireEvent.click(toolbar('Aplicar limites sugeridos'));
    fireEvent.click(screen.getByText('Aplicar'));
    await waitFor(() => expect(screen.getByText('Não foi possível aplicar os limites')).toBeTruthy());
  });
});

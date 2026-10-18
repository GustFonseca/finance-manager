import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { http } from '@/lib/http';
import { monthKeyOf, monthRange } from '@/lib/periods';
import { savingsApi } from '../api';
import {
  currentMonth,
  useApplySuggestedBudgets,
  useSavingsPlan,
  useSetBudget,
  useSetSavingsGoal,
  useSetWorkHours,
} from '../queries';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), put: jest.fn(), post: jest.fn() } }));

describe('savingsApi', () => {
  it('gets the plan for the month', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: { monthlyGoalCents: 1 } });
    await expect(savingsApi.get({ start: 's', end: 'e' })).resolves.toEqual({ monthlyGoalCents: 1 });
    expect(http.get).toHaveBeenCalledWith('/savings', { params: { start: 's', end: 'e' } });
  });

  it('sets the goal', async () => {
    jest.mocked(http.put).mockResolvedValue({ data: 'ignored' });
    await expect(savingsApi.setGoal(5000)).resolves.toBeUndefined();
    expect(http.put).toHaveBeenCalledWith('/savings/goal', { monthlyGoalCents: 5000 });
  });

  it('sets the work hours', async () => {
    jest.mocked(http.put).mockResolvedValue({ data: 'ignored' });
    await expect(savingsApi.setWorkHours(160)).resolves.toBeUndefined();
    expect(http.put).toHaveBeenCalledWith('/savings/work-hours', { hours: 160 });
  });

  it('sets a budget', async () => {
    jest.mocked(http.put).mockResolvedValue({ data: 'ignored' });
    await expect(savingsApi.setBudget('c1', null)).resolves.toBeUndefined();
    expect(http.put).toHaveBeenCalledWith('/savings/budgets/c1', { limitCents: null });
  });

  it('applies the suggested budgets', async () => {
    jest.mocked(http.post).mockResolvedValue({ data: 3 });
    await expect(savingsApi.applySuggested({ start: 's', end: 'e' })).resolves.toBe(3);
    expect(http.post).toHaveBeenCalledWith('/savings/budgets/apply-suggested', null, { params: { start: 's', end: 'e' } });
  });
});

describe('savings queries', () => {
  function setup() {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    return { client, wrapper, invalidate };
  }

  it('computes the current month range', () => {
    expect(currentMonth()).toEqual(monthRange(monthKeyOf(new Date())));
  });

  it('loads the plan', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: { historyMonths: 2 } });
    const { client, wrapper } = setup();
    const range = { start: 's', end: 'e' };
    const { result } = renderHook(() => useSavingsPlan(range), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ historyMonths: 2 }));
    expect(client.getQueryData(['savings', range])).toEqual({ historyMonths: 2 });
  });

  it('invalidates the plan after each mutation', async () => {
    jest.mocked(http.put).mockResolvedValue({ data: null });
    jest.mocked(http.post).mockResolvedValue({ data: 2 });
    const { wrapper, invalidate } = setup();

    const goal = renderHook(() => useSetSavingsGoal(), { wrapper });
    await act(() => goal.result.current.mutateAsync(1000));
    expect(http.put).toHaveBeenCalledWith('/savings/goal', { monthlyGoalCents: 1000 });

    const budget = renderHook(() => useSetBudget(), { wrapper });
    await act(() => budget.result.current.mutateAsync({ categoryId: 'c9', limitCents: 200 }));
    expect(http.put).toHaveBeenCalledWith('/savings/budgets/c9', { limitCents: 200 });

    const hours = renderHook(() => useSetWorkHours(), { wrapper });
    await act(() => hours.result.current.mutateAsync(150));
    expect(http.put).toHaveBeenCalledWith('/savings/work-hours', { hours: 150 });

    const apply = renderHook(() => useApplySuggestedBudgets(), { wrapper });
    await act(async () => {
      await expect(apply.result.current.mutateAsync({ start: 's', end: 'e' })).resolves.toBe(2);
    });

    expect(invalidate).toHaveBeenCalledTimes(8);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['savings'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
  });
});

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { debtsApi } from '../api';
import { useDebtPlan, useDebts, useDeleteDebt, useSaveDebt } from '../queries';

jest.mock('../api');

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  return { client, wrapper, invalidate };
}

const input = { name: 'Cartão', balanceCents: 100, monthlyRatePercent: 2.5, minimumPaymentCents: 10 };

describe('debts queries', () => {
  it('loads the debts and the plan for the chosen extra', async () => {
    jest.mocked(debtsApi.getAll).mockResolvedValue([{ id: 'd1' }] as never);
    jest.mocked(debtsApi.plan).mockResolvedValue({ extraCents: 300 } as never);
    const { client, wrapper } = setup();

    const debts = renderHook(() => useDebts(), { wrapper });
    const plan = renderHook(() => useDebtPlan(300), { wrapper });
    await waitFor(() => expect(debts.result.current.data).toEqual([{ id: 'd1' }]));
    await waitFor(() => expect(plan.result.current.data).toEqual({ extraCents: 300 }));
    expect(client.getQueryData(['debts', 'plan', 300])).toEqual({ extraCents: 300 });
  });

  it('does not simulate while disabled', () => {
    const { wrapper } = setup();
    renderHook(() => useDebtPlan(0, false), { wrapper });
    expect(debtsApi.plan).not.toHaveBeenCalled();
  });

  it('creates, updates and removes debts refreshing the debts and the summary', async () => {
    jest.mocked(debtsApi.create).mockResolvedValue({ id: 'd2' } as never);
    jest.mocked(debtsApi.update).mockResolvedValue({ id: 'd1' } as never);
    jest.mocked(debtsApi.remove).mockResolvedValue(undefined);
    const { wrapper, invalidate } = setup();

    const save = renderHook(() => useSaveDebt(), { wrapper });
    await act(() => save.result.current.mutateAsync({ id: null, data: input }));
    expect(debtsApi.create).toHaveBeenCalledWith(input);
    await act(() => save.result.current.mutateAsync({ id: 'd1', data: input }));
    expect(debtsApi.update).toHaveBeenCalledWith('d1', input);

    const remove = renderHook(() => useDeleteDebt(), { wrapper });
    await act(() => remove.result.current.mutateAsync('d1'));
    expect(debtsApi.remove).toHaveBeenCalledWith('d1');

    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([
      ['debts'],
      ['summary'],
      ['debts'],
      ['summary'],
      ['debts'],
      ['summary'],
    ]);
  });
});

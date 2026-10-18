import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { transactionsApi } from '../api';
import { invalidateMoney, useTransactions, useUpdateTransaction } from '../queries';

jest.mock('../api');

function wrapperFor(client = createTestQueryClient()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('transactions queries', () => {
  it('loads every transaction when no range is given', async () => {
    jest.mocked(transactionsApi.getAll).mockResolvedValue([]);
    const { client, wrapper } = wrapperFor();
    const { result } = renderHook(() => useTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionsApi.getAll).toHaveBeenCalledWith({});
    expect(client.getQueryData(['transactions', {}])).toEqual([]);
  });

  it('does not fetch while disabled', () => {
    const { wrapper } = wrapperFor();
    const { result } = renderHook(() => useTransactions({ merchantId: 'm' }, false), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(transactionsApi.getAll).not.toHaveBeenCalled();
  });

  it('invalidates every query that depends on money', () => {
    const client = createTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    invalidateMoney(client);

    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([
      ['transactions'],
      ['accounts'],
      ['summary'],
      ['savings'],
      ['merchants'],
    ]);
  });

  it('updates a transaction and refreshes the money queries', async () => {
    jest.mocked(transactionsApi.update).mockResolvedValue({ id: 't1' } as never);
    const { client, wrapper } = wrapperFor();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper });
    const data = { accountId: 'a', categoryId: 'c', type: 'EXPENSE' as const, amountCents: 1, description: '', date: 'd' };

    await act(() => result.current.mutateAsync({ id: 't1', data }));

    expect(transactionsApi.update).toHaveBeenCalledWith('t1', data);
    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([
      ['transactions'],
      ['accounts'],
      ['summary'],
      ['savings'],
      ['merchants'],
    ]);
  });
});

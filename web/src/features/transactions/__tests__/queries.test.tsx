import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { foldersApi } from '@/features/files/api';
import { transactionsApi } from '../api';
import { invalidateMoney, useSetReceipt, useTransactions, useUpdateTransaction } from '../queries';

jest.mock('../api');
jest.mock('@/features/files/api');

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
      ['challenges'],
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
      ['challenges'],
    ]);
  });

  it('uploads the receipt, attaches it and refreshes money and files', async () => {
    jest.mocked(foldersApi.getAll).mockResolvedValue([{ id: 'fo1', name: 'Comprovantes', isSystem: false, fileCount: 0, createdAt: '' }]);
    jest.mocked(foldersApi.upload).mockResolvedValue([{ id: 'f9' }] as never);
    jest.mocked(transactionsApi.setReceipt).mockResolvedValue({ id: 't1' } as never);
    const { client, wrapper } = wrapperFor();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSetReceipt(), { wrapper });
    const file = new File(['x'], 'nota.pdf');

    await act(() => result.current.mutateAsync({ id: 't1', file }));
    expect(foldersApi.upload).toHaveBeenCalledWith('fo1', [file]);
    expect(transactionsApi.setReceipt).toHaveBeenCalledWith('t1', 'f9');
    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([
      ['transactions'],
      ['accounts'],
      ['summary'],
      ['savings'],
      ['merchants'],
      ['challenges'],
      ['folders'],
      ['files'],
      ['trash'],
    ]);

    await act(() => result.current.mutateAsync({ id: 't1', file: null }));
    expect(transactionsApi.setReceipt).toHaveBeenLastCalledWith('t1', null);
    expect(foldersApi.upload).toHaveBeenCalledTimes(1);
  });

  it('refreshes the files even when attaching fails', async () => {
    jest.mocked(transactionsApi.setReceipt).mockRejectedValue(new Error('x'));
    const { client, wrapper } = wrapperFor();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSetReceipt(), { wrapper });

    await act(() => expect(result.current.mutateAsync({ id: 't1', file: null })).rejects.toThrow('x'));
    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([['folders'], ['files'], ['trash']]);
  });
});

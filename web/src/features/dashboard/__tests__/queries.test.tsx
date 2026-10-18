import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { useForecast, useRecurringExpenses, useSummary } from '../queries';
import { summaryApi } from '../api';

jest.mock('../api');

function wrapper() {
  const client = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('dashboard queries', () => {
  it('loads the summary with the filter in the key', async () => {
    jest.mocked(summaryApi.get).mockResolvedValue({ balanceCents: 5 } as never);
    const { client, Wrapper } = wrapper();
    const { result } = renderHook(() => useSummary({ accountId: 'a1' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ balanceCents: 5 }));
    expect(summaryApi.get).toHaveBeenCalledWith({ accountId: 'a1' });
    expect(client.getQueryData(['summary', { accountId: 'a1' }])).toEqual({ balanceCents: 5 });
  });

  it('defaults to an empty filter', async () => {
    jest.mocked(summaryApi.get).mockResolvedValue({} as never);
    jest.mocked(summaryApi.recurring).mockResolvedValue([]);
    const { client, Wrapper } = wrapper();
    const summary = renderHook(() => useSummary(), { wrapper: Wrapper });
    const recurring = renderHook(() => useRecurringExpenses(), { wrapper: Wrapper });
    await waitFor(() => expect(summary.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(recurring.result.current.isSuccess).toBe(true));
    expect(summaryApi.get).toHaveBeenCalledWith({});
    expect(summaryApi.recurring).toHaveBeenCalledWith({});
    expect(client.getQueryData(['summary', 'recurring', {}])).toEqual([]);
  });

  it('loads the forecast with the filter in the key', async () => {
    jest.mocked(summaryApi.forecast).mockResolvedValue({ projectedBalanceCents: 9 } as never);
    const { client, Wrapper } = wrapper();
    const { result } = renderHook(() => useForecast({ start: 's', end: 'e' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ projectedBalanceCents: 9 }));
    expect(summaryApi.forecast).toHaveBeenCalledWith({ start: 's', end: 'e' });
    expect(client.getQueryData(['summary', 'forecast', { start: 's', end: 'e' }])).toEqual({ projectedBalanceCents: 9 });
  });

  it('loads the forecast with an empty filter by default', async () => {
    jest.mocked(summaryApi.forecast).mockResolvedValue({} as never);
    const { client, Wrapper } = wrapper();
    const { result } = renderHook(() => useForecast(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(summaryApi.forecast).toHaveBeenCalledWith({});
    expect(client.getQueryData(['summary', 'forecast', {}])).toEqual({});
  });
});

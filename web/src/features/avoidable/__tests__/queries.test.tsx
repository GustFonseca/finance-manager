import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { avoidableApi } from '../api';
import { useAvoidableSpending, useDismissInsight, useSetSubscriptionChoice } from '../queries';
import { emptyReport } from './fixtures';

jest.mock('../api');

describe('avoidable queries', () => {
  it('caches the avoidable spending under the summary key so it refreshes with the money queries', async () => {
    jest.mocked(avoidableApi.get).mockResolvedValue(emptyReport);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const filter = { start: 's', end: 'e', accountId: undefined };
    const { result } = renderHook(() => useAvoidableSpending(filter), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(avoidableApi.get).toHaveBeenCalledWith(filter);
    expect(client.getQueryData(['summary', 'avoidable', filter])).toEqual(emptyReport);

    await act(() => client.invalidateQueries({ queryKey: ['summary'] }));
    await waitFor(() => expect(avoidableApi.get).toHaveBeenCalledTimes(2));
  });

  function setup() {
    const client = createTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { invalidate, wrapper };
  }

  it('dismisses an alert and refreshes the summary, which holds the analysis', async () => {
    jest.mocked(avoidableApi.dismiss).mockResolvedValue(undefined);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useDismissInsight(), { wrapper });

    await act(() => result.current.mutateAsync('dup:t1'));

    expect(avoidableApi.dismiss).toHaveBeenCalledWith('dup:t1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
  });

  it('saves the subscription choice and refreshes the summary, which holds the analysis', async () => {
    jest.mocked(avoidableApi.setSubscriptionChoice).mockResolvedValue(undefined);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetSubscriptionChoice(), { wrapper });
    const choice = { key: 'sub:netflix', name: 'Netflix', choice: 'KEEP' as const };

    await act(() => result.current.mutateAsync(choice));

    expect(avoidableApi.setSubscriptionChoice).toHaveBeenCalledWith(choice);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary'] });
  });
});

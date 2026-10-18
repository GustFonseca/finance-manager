import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { avoidableApi } from '../api';
import { useAvoidableSpending } from '../queries';
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
});

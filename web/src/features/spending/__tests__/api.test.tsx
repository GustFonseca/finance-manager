import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { http } from '@/lib/http';
import { spendingApi } from '../api';
import { useSpendingAnalysis } from '../queries';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('spendingApi', () => {
  it('gets the analysis for the period and account', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ monthExpenseCents: 3 }));
    await expect(spendingApi.get({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ monthExpenseCents: 3 });
    expect(http.get).toHaveBeenCalledWith('/summary/spending', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });
});

describe('useSpendingAnalysis', () => {
  it('caches the analysis under the summary key', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ monthExpenseCents: 7 }));
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const filter = { start: 's', end: 'e' };
    const { result } = renderHook(() => useSpendingAnalysis(filter), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ monthExpenseCents: 7 }));
    expect(client.getQueryData(['summary', 'spending', filter])).toEqual({ monthExpenseCents: 7 });
  });
});

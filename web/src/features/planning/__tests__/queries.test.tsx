import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { planningApi } from '../api';
import { useEmergencyFund, useNetWorth, useSeasonalExpenses, useSetEmergencyFund } from '../queries';

jest.mock('../api');

const range = { start: 's', end: 'e' };

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  return { client, wrapper, invalidate };
}

describe('planning queries', () => {
  it('keeps every planning query under the summary so money changes refresh them', async () => {
    jest.mocked(planningApi.emergency).mockResolvedValue({ months: 6 } as never);
    jest.mocked(planningApi.seasonal).mockResolvedValue({ items: [] } as never);
    jest.mocked(planningApi.netWorth).mockResolvedValue({ netCents: 1 } as never);
    const { client, wrapper } = setup();

    const emergency = renderHook(() => useEmergencyFund(range), { wrapper });
    const seasonal = renderHook(() => useSeasonalExpenses(range), { wrapper });
    const netWorth = renderHook(() => useNetWorth(range), { wrapper });
    await waitFor(() => expect(emergency.result.current.data).toEqual({ months: 6 }));
    await waitFor(() => expect(seasonal.result.current.data).toEqual({ items: [] }));
    await waitFor(() => expect(netWorth.result.current.data).toEqual({ netCents: 1 }));
    expect(client.getQueryData(['summary', 'planning', 'emergency', range])).toEqual({ months: 6 });
    expect(client.getQueryData(['summary', 'planning', 'seasonal', range])).toEqual({ items: [] });
    expect(client.getQueryData(['summary', 'planning', 'net-worth', range])).toEqual({ netCents: 1 });
  });

  it('refreshes the planning after saving the emergency fund', async () => {
    jest.mocked(planningApi.setEmergency).mockResolvedValue(undefined);
    const { wrapper, invalidate } = setup();

    const save = renderHook(() => useSetEmergencyFund(), { wrapper });
    await act(() => save.result.current.mutateAsync({ months: 3, goalId: 'g1' }));
    expect(planningApi.setEmergency).toHaveBeenCalledWith({ months: 3, goalId: 'g1' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['summary', 'planning'] });
  });
});

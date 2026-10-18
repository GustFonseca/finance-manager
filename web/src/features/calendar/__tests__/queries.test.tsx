import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { calendarApi } from '../api';
import { useCalendar } from '../queries';

jest.mock('../api');

describe('useCalendar', () => {
  it('keeps the calendar under the summary so money changes refresh it', async () => {
    jest.mocked(calendarApi.get).mockResolvedValue({ days: [] } as never);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const range = { start: 's', end: 'e' };

    const { result } = renderHook(() => useCalendar(range), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ days: [] }));
    expect(calendarApi.get).toHaveBeenCalledWith(range);
    expect(client.getQueryData(['summary', 'calendar', range])).toEqual({ days: [] });
  });
});

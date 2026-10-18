import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { http } from '@/lib/http';
import { activityApi } from '../api';
import { ACTIVITY_PAGE_SIZE, useActivity } from '../queries';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('activityApi', () => {
  it('gets a page before a date', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse([{ id: '1' }]));
    await expect(activityApi.getPage('2026-10-01', 10)).resolves.toEqual([{ id: '1' }]);
    expect(http.get).toHaveBeenCalledWith('/activity', { params: { before: '2026-10-01', limit: 10 } });
  });

  it('defaults to the newest 50 events', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse([]));
    await activityApi.getPage();
    expect(http.get).toHaveBeenCalledWith('/activity', { params: { before: undefined, limit: 50 } });
  });
});

describe('useActivity', () => {
  it('asks for the next page only when the last one was full', async () => {
    const full = Array.from({ length: ACTIVITY_PAGE_SIZE }, (_, i) => ({ id: `${i}`, createdAt: `d${i}` }));
    jest.mocked(http.get)
      .mockResolvedValueOnce(httpResponse(full))
      .mockResolvedValueOnce(httpResponse([{ id: 'x', createdAt: 'dx' }]));
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useActivity(), { wrapper });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    await act(() => result.current.fetchNextPage());
    expect(http.get).toHaveBeenLastCalledWith('/activity', { params: { before: 'd49', limit: 50 } });
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(result.current.data?.pages).toHaveLength(2);
  });
});

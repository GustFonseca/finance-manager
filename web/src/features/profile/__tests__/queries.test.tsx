import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { profileApi } from '../api';
import { PROFILE_STALE_TIME_MS, useProfile } from '../queries';

jest.mock('../api');

describe('profile queries', () => {
  it('caches the profile under its own key for a long time', async () => {
    const profile = { email: 'g@x.com', name: 'Gustavo', isAdmin: false };
    jest.mocked(profileApi.get).mockResolvedValue(profile);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(client.getQueryData(['profile'])).toEqual(profile);
    expect(client.getQueryCache().find({ queryKey: ['profile'] })?.options).toMatchObject({ staleTime: PROFILE_STALE_TIME_MS });
    expect(PROFILE_STALE_TIME_MS).toBeGreaterThanOrEqual(10 * 60_000);
  });
});

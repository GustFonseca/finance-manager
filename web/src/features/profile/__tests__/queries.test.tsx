import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { createTestQueryClient } from '@/test/render';
import { profileApi } from '../api';
import { PROFILE_STALE_TIME_MS, useProfile, useUpdateProfile } from '../queries';
import { profile, profileUpdate } from './fixtures';

jest.mock('../api');
jest.mock('@/features/auth/AuthContext', () => ({ useAuth: jest.fn() }));

const updateUser = jest.fn();

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  updateUser.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({ updateUser } as unknown as ReturnType<typeof useAuth>);
});

describe('profile queries', () => {
  it('caches the profile under its own key for a long time', async () => {
    jest.mocked(profileApi.get).mockResolvedValue(profile());
    const { client, wrapper } = setup();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(profile()));
    expect(client.getQueryData(['profile'])).toEqual(profile());
    expect(client.getQueryCache().find({ queryKey: ['profile'] })?.options).toMatchObject({ staleTime: PROFILE_STALE_TIME_MS });
    expect(PROFILE_STALE_TIME_MS).toBeGreaterThanOrEqual(10 * 60_000);
  });

  it('stores the saved profile in the cache and renames the signed in user', async () => {
    const saved = profile({ name: 'Gustavo Fonseca', avatarIcon: 'rocket' });
    jest.mocked(profileApi.update).mockResolvedValue(saved);
    const { client, wrapper } = setup();
    client.setQueryData(['profile'], profile());

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    await act(() => result.current.mutateAsync(profileUpdate({ name: 'Gustavo Fonseca' })));

    expect(profileApi.update).toHaveBeenCalledWith(profileUpdate({ name: 'Gustavo Fonseca' }));
    expect(client.getQueryData(['profile'])).toEqual(saved);
    expect(updateUser).toHaveBeenCalledWith({ name: 'Gustavo Fonseca' });
  });
});

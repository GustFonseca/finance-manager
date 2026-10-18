import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { challengesApi } from '../api';
import { useChallenges, useCreateChallenge, useDeleteChallenge } from '../queries';

jest.mock('../api');

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  return { client, wrapper, invalidate };
}

describe('challenges queries', () => {
  it('loads the challenges', async () => {
    jest.mocked(challengesApi.getAll).mockResolvedValue([{ id: 'c1' }] as never);
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useChallenges(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'c1' }]));
    expect(client.getQueryData(['challenges'])).toEqual([{ id: 'c1' }]);
  });

  it('refreshes the challenges after creating and removing one', async () => {
    jest.mocked(challengesApi.create).mockResolvedValue({ id: 'c2' } as never);
    jest.mocked(challengesApi.remove).mockResolvedValue(undefined);
    const { wrapper, invalidate } = setup();
    const data = { name: 'Sem bar', scope: 'MERCHANT' as const, targetId: 'm1', limitCents: 0, startsOn: 's', days: 30 };

    const create = renderHook(() => useCreateChallenge(), { wrapper });
    await act(() => create.result.current.mutateAsync(data));
    expect(challengesApi.create).toHaveBeenCalledWith(data);

    const remove = renderHook(() => useDeleteChallenge(), { wrapper });
    await act(() => remove.result.current.mutateAsync('c2'));
    expect(challengesApi.remove).toHaveBeenCalledWith('c2');

    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([['challenges'], ['challenges']]);
  });
});

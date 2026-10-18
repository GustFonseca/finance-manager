import { MutationObserver } from '@tanstack/react-query';
import { queryClient } from '../queryClient';

afterEach(() => queryClient.clear());

describe('queryClient', () => {
  it('refreshes the activity log after any successful mutation', async () => {
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    await new MutationObserver(queryClient, { mutationFn: async () => 'ok' }).mutate();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['activity'] });
  });

  it('does not refresh the activity log when a mutation fails', async () => {
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    await expect(
      new MutationObserver(queryClient, { mutationFn: () => Promise.reject(new Error('x')) }).mutate()
    ).rejects.toThrow('x');

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('keeps data fresh for two minutes, retries once and ignores window focus', () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 120_000,
      retry: 1,
      refetchOnWindowFocus: false,
    });
  });
});

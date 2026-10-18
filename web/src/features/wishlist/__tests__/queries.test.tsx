import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { wishlistApi } from '../api';
import { useCreateWish, useDecideWish, useDeleteWish, useWishlist } from '../queries';

jest.mock('../api');

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  return { client, wrapper, invalidate };
}

describe('wishlist queries', () => {
  it('loads the wishlist', async () => {
    jest.mocked(wishlistApi.get).mockResolvedValue({ items: [] } as never);
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ items: [] }));
    expect(client.getQueryData(['wishlist'])).toEqual({ items: [] });
  });

  it('refreshes the wishlist after adding, deciding and removing', async () => {
    jest.mocked(wishlistApi.create).mockResolvedValue({ id: 'w1' } as never);
    jest.mocked(wishlistApi.decide).mockResolvedValue({ id: 'w1' } as never);
    jest.mocked(wishlistApi.remove).mockResolvedValue(undefined);
    const { wrapper, invalidate } = setup();
    const input = { name: 'Fone', priceCents: 100, link: null };

    const create = renderHook(() => useCreateWish(), { wrapper });
    await act(() => create.result.current.mutateAsync(input));
    expect(wishlistApi.create).toHaveBeenCalledWith(input);

    const decide = renderHook(() => useDecideWish(), { wrapper });
    await act(() => decide.result.current.mutateAsync({ id: 'w1', status: 'BOUGHT' }));
    expect(wishlistApi.decide).toHaveBeenCalledWith('w1', 'BOUGHT');

    const remove = renderHook(() => useDeleteWish(), { wrapper });
    await act(() => remove.result.current.mutateAsync('w1'));
    expect(wishlistApi.remove).toHaveBeenCalledWith('w1');

    expect(invalidate.mock.calls.map(([filter]) => filter?.queryKey)).toEqual([['wishlist'], ['wishlist'], ['wishlist']]);
  });
});

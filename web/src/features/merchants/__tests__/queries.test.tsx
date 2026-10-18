import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { merchantsApi } from '../api';
import { useSetMerchantClass } from '../queries';

jest.mock('../api');

describe('merchants queries', () => {
  it('sets the class of a merchant and refreshes the money queries', async () => {
    jest.mocked(merchantsApi.setClass).mockResolvedValue({ id: 'm1' } as never);
    const client = createTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSetMerchantClass(), { wrapper });

    await act(() => result.current.mutateAsync({ id: 'm1', spendingClass: 'SUPERFLUOUS' }));

    expect(merchantsApi.setClass).toHaveBeenCalledWith('m1', 'SUPERFLUOUS');
    const keys = invalidate.mock.calls.map(([filter]) => filter?.queryKey);
    expect(keys).toEqual(expect.arrayContaining([['merchants'], ['summary'], ['transactions']]));
  });
});

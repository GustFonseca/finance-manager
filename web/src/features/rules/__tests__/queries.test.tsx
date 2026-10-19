import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { rulesApi } from '../api';
import { useRules, useSaveRule, useSetRuleActive, useTestRule } from '../queries';
import { rule } from './fixtures';

jest.mock('../api');

const input = { type: 'BRAND' as const, pattern: 'ifood', value: 'iFood', priority: 100, note: null };

function setup() {
  const client = createTestQueryClient();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

describe('rules queries', () => {
  it('caches the rules under their own key', async () => {
    jest.mocked(rulesApi.getAll).mockResolvedValue([rule()]);
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useRules(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([rule()]));
    expect(client.getQueryData(['rules'])).toEqual([rule()]);
  });

  it('creates a new rule and refreshes every analysis query, since rules change every analysis', async () => {
    jest.mocked(rulesApi.create).mockResolvedValue(rule());
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSaveRule(), { wrapper });

    await act(() => result.current.mutateAsync({ data: input }));

    expect(rulesApi.create).toHaveBeenCalledWith(input);
    expect(rulesApi.update).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['rules'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['files'] });
  });

  it('updates an existing rule', async () => {
    jest.mocked(rulesApi.update).mockResolvedValue(rule());
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSaveRule(), { wrapper });

    await act(() => result.current.mutateAsync({ id: 'r1', data: input }));

    expect(rulesApi.update).toHaveBeenCalledWith('r1', input);
    expect(rulesApi.create).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['rules'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['files'] });
  });

  it('turns a rule off and refreshes every analysis query', async () => {
    jest.mocked(rulesApi.setActive).mockResolvedValue(rule({ isActive: false }));
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetRuleActive(), { wrapper });

    await act(() => result.current.mutateAsync({ id: 'r1', isActive: false }));

    expect(rulesApi.setActive).toHaveBeenCalledWith('r1', false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['rules'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['files'] });
  });

  it('tests a pattern without touching the cache', async () => {
    const outcome = { valid: true, error: null, matchCount: 1, checkedCount: 3, samples: [] };
    jest.mocked(rulesApi.test).mockResolvedValue(outcome);
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useTestRule(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('ifood')).resolves.toEqual(outcome);
    });

    expect(rulesApi.test).toHaveBeenCalledWith('ifood');
    expect(invalidate).not.toHaveBeenCalled();
  });
});

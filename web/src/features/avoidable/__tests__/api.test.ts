import { http } from '@/lib/http';
import { avoidableApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));

describe('avoidableApi', () => {
  it('gets the avoidable spending for a period and account', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ monthCents: 1 }));

    await expect(avoidableApi.get({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ monthCents: 1 });
    expect(http.get).toHaveBeenCalledWith('/summary/avoidable', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });

  it('dismisses an alert by its key', async () => {
    jest.mocked(http.post).mockResolvedValue(httpResponse(undefined, 204));

    await expect(avoidableApi.dismiss('dup:t1')).resolves.toBeUndefined();
    expect(http.post).toHaveBeenCalledWith('/summary/dismissals', { key: 'dup:t1' });
  });

  it('saves the choice made for a subscription', async () => {
    jest.mocked(http.put).mockResolvedValue(httpResponse(undefined, 204));
    const choice = { key: 'sub:netflix', name: 'Netflix', choice: 'CANCEL' as const };

    await expect(avoidableApi.setSubscriptionChoice(choice)).resolves.toBeUndefined();
    expect(http.put).toHaveBeenCalledWith('/summary/subscriptions/choice', choice);
  });
});

import { http } from '@/lib/http';
import { avoidableApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('avoidableApi', () => {
  it('gets the avoidable spending for a period and account', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: { monthCents: 1 } });

    await expect(avoidableApi.get({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ monthCents: 1 });
    expect(http.get).toHaveBeenCalledWith('/summary/avoidable', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });
});

import { http } from '@/lib/http';
import { summaryApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('summaryApi', () => {
  it('gets the summary for a period and account', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ balanceCents: 1 }));
    await expect(summaryApi.get({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ balanceCents: 1 });
    expect(http.get).toHaveBeenCalledWith('/summary', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });

  it('gets the summary without filters', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({}));
    await summaryApi.get();
    expect(http.get).toHaveBeenCalledWith('/summary', { params: { start: undefined, end: undefined, accountId: undefined } });
  });

  it('gets the recurring expenses until the end of the period', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse([{ name: 'Netflix' }]));
    await expect(summaryApi.recurring({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual([{ name: 'Netflix' }]);
    expect(http.get).toHaveBeenCalledWith('/summary/recurring', { params: { end: 'e', accountId: 'a1' } });
  });

  it('gets the recurring expenses without filters', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse([]));
    await summaryApi.recurring();
    expect(http.get).toHaveBeenCalledWith('/summary/recurring', { params: { end: undefined, accountId: undefined } });
  });

  it('gets the cash flow forecast for a period and account', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ projectedBalanceCents: 7 }));
    await expect(summaryApi.forecast({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ projectedBalanceCents: 7 });
    expect(http.get).toHaveBeenCalledWith('/summary/forecast', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });

  it('gets the cash flow forecast without filters', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({}));
    await summaryApi.forecast();
    expect(http.get).toHaveBeenCalledWith('/summary/forecast', { params: { start: undefined, end: undefined, accountId: undefined } });
  });

  it('gets the daily budget for the month and the start of today, ignoring the account', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ leftTodayCents: 3 }));
    await expect(summaryApi.daily({ start: 's', end: 'e', accountId: 'a1' }, 'd')).resolves.toEqual({ leftTodayCents: 3 });
    expect(http.get).toHaveBeenCalledWith('/summary/daily', { params: { start: 's', end: 'e', dayStart: 'd' } });
  });

  it('gets the weekly and monthly digest for the month and the start of today', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ goals: [] }));
    await expect(summaryApi.digest({ start: 's', end: 'e', accountId: 'a1' }, 'd')).resolves.toEqual({ goals: [] });
    expect(http.get).toHaveBeenCalledWith('/summary/digest', { params: { start: 's', end: 'e', dayStart: 'd' } });
  });
});

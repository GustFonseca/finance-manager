import { http } from '@/lib/http';
import { summaryApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('summaryApi', () => {
  it('gets the summary for a period and account', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: { balanceCents: 1 } });
    await expect(summaryApi.get({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual({ balanceCents: 1 });
    expect(http.get).toHaveBeenCalledWith('/summary', { params: { start: 's', end: 'e', accountId: 'a1' } });
  });

  it('gets the summary without filters', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: {} });
    await summaryApi.get();
    expect(http.get).toHaveBeenCalledWith('/summary', { params: { start: undefined, end: undefined, accountId: undefined } });
  });

  it('gets the recurring expenses until the end of the period', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: [{ name: 'Netflix' }] });
    await expect(summaryApi.recurring({ start: 's', end: 'e', accountId: 'a1' })).resolves.toEqual([{ name: 'Netflix' }]);
    expect(http.get).toHaveBeenCalledWith('/summary/recurring', { params: { end: 'e', accountId: 'a1' } });
  });

  it('gets the recurring expenses without filters', async () => {
    jest.mocked(http.get).mockResolvedValue({ data: [] });
    await summaryApi.recurring();
    expect(http.get).toHaveBeenCalledWith('/summary/recurring', { params: { end: undefined, accountId: undefined } });
  });
});

import { http } from '@/lib/http';
import { merchantsApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

describe('merchantsApi', () => {
  it('lists merchants', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 'm' }] });
    await expect(merchantsApi.getAll()).resolves.toEqual([{ id: 'm' }]);
    expect(mocked.get).toHaveBeenCalledWith('/merchants');
  });

  it('resolves statement lines', async () => {
    const lines = [{ description: 'iFood', type: 'EXPENSE' as const }];
    mocked.post.mockResolvedValue({ data: [{ name: 'iFood' }] });
    await expect(merchantsApi.resolve(lines)).resolves.toEqual([{ name: 'iFood' }]);
    expect(mocked.post).toHaveBeenCalledWith('/merchants/resolve', { lines });
  });

  it('updates a merchant', async () => {
    const data = { name: 'iFood', kind: 'BUSINESS' as const, categoryId: 'c', applyToTransactions: true };
    mocked.put.mockResolvedValue({ data: { updatedTransactions: 2 } });
    await expect(merchantsApi.update('m', data)).resolves.toEqual({ updatedTransactions: 2 });
    expect(mocked.put).toHaveBeenCalledWith('/merchants/m', data);
  });

  it('loads spending and history with their periods', async () => {
    mocked.get.mockResolvedValue({ data: { ok: true } });
    await expect(merchantsApi.spending({ start: 's', end: 'e', accountId: 'a', merchantId: 'x' })).resolves.toEqual({ ok: true });
    await expect(merchantsApi.history('m', { start: 's', end: 'e' })).resolves.toEqual({ ok: true });
    expect(mocked.get).toHaveBeenCalledWith('/merchants/spending', { params: { start: 's', end: 'e', accountId: 'a' } });
    expect(mocked.get).toHaveBeenCalledWith('/merchants/m/history', { params: { start: 's', end: 'e' } });
  });
});

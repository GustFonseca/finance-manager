import { http } from '@/lib/http';
import { merchantsApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

beforeEach(() => jest.clearAllMocks());

describe('merchantsApi', () => {
  it('lists merchants', async () => {
    mocked.get.mockResolvedValue(httpResponse([{ id: 'm' }]));
    await expect(merchantsApi.getAll()).resolves.toEqual([{ id: 'm' }]);
    expect(mocked.get).toHaveBeenCalledWith('/merchants');
  });

  it('resolves statement lines', async () => {
    const lines = [{ description: 'iFood', type: 'EXPENSE' as const }];
    mocked.post.mockResolvedValue(httpResponse([{ name: 'iFood' }]));
    await expect(merchantsApi.resolve(lines)).resolves.toEqual([{ name: 'iFood' }]);
    expect(mocked.post).toHaveBeenCalledWith('/merchants/resolve', { lines });
  });

  it('updates a merchant', async () => {
    const data = { name: 'iFood', kind: 'BUSINESS' as const, categoryId: 'c', applyToTransactions: true };
    mocked.put.mockResolvedValue(httpResponse({ updatedTransactions: 2 }));
    await expect(merchantsApi.update('m', data)).resolves.toEqual({ updatedTransactions: 2 });
    expect(mocked.put).toHaveBeenCalledWith('/merchants/m', data);
    expect(mocked.put).toHaveBeenCalledTimes(1);
  });

  it('sets the spending class of a merchant', async () => {
    mocked.put.mockResolvedValue(httpResponse({ id: 'm', class: 'ESSENTIAL' }));
    await expect(merchantsApi.setClass('m', 'ESSENTIAL')).resolves.toEqual({ id: 'm', class: 'ESSENTIAL' });
    expect(mocked.put).toHaveBeenCalledWith('/merchants/m/class', { class: 'ESSENTIAL' });
  });

  it('updates a merchant and then its class when the class is given', async () => {
    const data = { name: 'iFood', kind: 'BUSINESS' as const, categoryId: 'c', applyToTransactions: true };
    mocked.put
      .mockResolvedValueOnce(httpResponse({ merchant: { id: 'm', class: null }, updatedTransactions: 2 }))
      .mockResolvedValueOnce(httpResponse({ id: 'm', class: null, name: 'iFood' }));

    await expect(merchantsApi.update('m', { ...data, class: null })).resolves.toEqual({
      merchant: { id: 'm', class: null, name: 'iFood' },
      updatedTransactions: 2,
    });
    expect(mocked.put).toHaveBeenNthCalledWith(1, '/merchants/m', data);
    expect(mocked.put.mock.calls[0][1]).not.toHaveProperty('class');
    expect(mocked.put).toHaveBeenNthCalledWith(2, '/merchants/m/class', { class: null });
  });

  it('loads spending and history with their periods', async () => {
    mocked.get.mockResolvedValue(httpResponse({ ok: true }));
    await expect(merchantsApi.spending({ start: 's', end: 'e', accountId: 'a', merchantId: 'x' })).resolves.toEqual({ ok: true });
    await expect(merchantsApi.history('m', { start: 's', end: 'e' })).resolves.toEqual({ ok: true });
    expect(mocked.get).toHaveBeenCalledWith('/merchants/spending', { params: { start: 's', end: 'e', accountId: 'a' } });
    expect(mocked.get).toHaveBeenCalledWith('/merchants/m/history', { params: { start: 's', end: 'e' } });
  });

  it('lists the merchants without a category in a period', async () => {
    mocked.get.mockResolvedValue(httpResponse([{ merchantId: 'm' }]));
    await expect(merchantsApi.unsorted({ start: 's', end: 'e' })).resolves.toEqual([{ merchantId: 'm' }]);
    expect(mocked.get).toHaveBeenCalledWith('/merchants/unsorted', { params: { start: 's', end: 'e' } });
  });
});

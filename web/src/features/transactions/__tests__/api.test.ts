import { http } from '@/lib/http';
import { transactionsApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

describe('transactionsApi', () => {
  it('lists transactions with every filter as params', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 't' }] });
    await expect(
      transactionsApi.getAll({
        start: 's',
        end: 'e',
        accountId: 'a',
        merchantId: 'm',
        categoryId: 'c',
        type: 'INCOME',
        search: 'ifood',
      })
    ).resolves.toEqual([{ id: 't' }]);
    expect(mocked.get.mock.calls[0]).toStrictEqual([
      '/transactions',
      { params: { start: 's', end: 'e', accountId: 'a', merchantId: 'm', categoryId: 'c', type: 'INCOME', search: 'ifood' } },
    ]);
  });

  it('omits an empty search', async () => {
    mocked.get.mockResolvedValue({ data: [] });
    await transactionsApi.getAll({ search: '' });
    expect(mocked.get.mock.calls[0][1]).toStrictEqual({
      params: {
        start: undefined,
        end: undefined,
        accountId: undefined,
        merchantId: undefined,
        categoryId: undefined,
        type: undefined,
        search: undefined,
      },
    });
  });

  it('lists transactions without a filter', async () => {
    mocked.get.mockResolvedValue({ data: [] });
    await transactionsApi.getAll();
    expect(mocked.get).toHaveBeenCalledWith('/transactions', {
      params: {
        start: undefined,
        end: undefined,
        accountId: undefined,
        merchantId: undefined,
        categoryId: undefined,
        type: undefined,
        search: undefined,
      },
    });
  });

  it('creates a transaction', async () => {
    const body = { accountId: 'a', categoryId: 'c', type: 'EXPENSE' as const, amountCents: 10, description: 'x', date: 'd' };
    mocked.post.mockResolvedValue({ data: { id: 'n' } });
    await expect(transactionsApi.create(body)).resolves.toEqual({ id: 'n' });
    expect(mocked.post).toHaveBeenCalledWith('/transactions', body);
  });

  it('updates a transaction', async () => {
    const body = { accountId: 'a', categoryId: 'c', type: 'INCOME' as const, amountCents: 10, description: 'x', date: 'd', recurrence: 'MONTHLY' as const };
    mocked.put.mockResolvedValue({ data: { id: 't1' } });
    await expect(transactionsApi.update('t1', body)).resolves.toEqual({ id: 't1' });
    expect(mocked.put).toHaveBeenCalledWith('/transactions/t1', body);
  });

  it('imports many lines and returns the imported count', async () => {
    const body = { accountId: 'a', lines: [] };
    mocked.post.mockResolvedValue({ data: { imported: 3 } });
    await expect(transactionsApi.importMany(body)).resolves.toBe(3);
    expect(mocked.post).toHaveBeenCalledWith('/transactions/import', body);
  });

  it('removes one transaction', async () => {
    mocked.delete.mockResolvedValue({ data: {} });
    await expect(transactionsApi.remove('t1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/transactions/t1');
  });

  it('removes all transactions and returns the deleted count', async () => {
    mocked.delete.mockResolvedValue({ data: { deleted: 7 } });
    await expect(transactionsApi.removeAll()).resolves.toBe(7);
    expect(mocked.delete).toHaveBeenCalledWith('/transactions');
  });
});

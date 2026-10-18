import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { debtsApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);
const input = { name: 'Cartão', balanceCents: 100, monthlyRatePercent: 2.5, minimumPaymentCents: 10 };

describe('debtsApi', () => {
  it('lists, creates and updates debts', async () => {
    mocked.get.mockResolvedValue(httpResponse([{ id: 'd1' }]));
    mocked.post.mockResolvedValue(httpResponse({ id: 'd2' }));
    mocked.put.mockResolvedValue(httpResponse({ id: 'd1' }));

    await expect(debtsApi.getAll()).resolves.toEqual([{ id: 'd1' }]);
    await expect(debtsApi.create(input)).resolves.toEqual({ id: 'd2' });
    await expect(debtsApi.update('d1', input)).resolves.toEqual({ id: 'd1' });
    expect(mocked.get).toHaveBeenCalledWith('/debts');
    expect(mocked.post).toHaveBeenCalledWith('/debts', input);
    expect(mocked.put).toHaveBeenCalledWith('/debts/d1', input);
  });

  it('removes a debt and simulates the payoff plan', async () => {
    mocked.delete.mockResolvedValue(httpResponse(undefined));
    mocked.get.mockResolvedValue(httpResponse({ extraCents: 500 }));

    await expect(debtsApi.remove('d1')).resolves.toBeUndefined();
    await expect(debtsApi.plan(500)).resolves.toEqual({ extraCents: 500 });
    expect(mocked.delete).toHaveBeenCalledWith('/debts/d1');
    expect(mocked.get).toHaveBeenCalledWith('/debts/plan', { params: { extraCents: 500 } });
  });
});

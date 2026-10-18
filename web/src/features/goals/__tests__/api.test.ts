import { http } from '@/lib/http';
import { goalsApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

describe('goalsApi', () => {
  it('lists and creates goals', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 'g' }] });
    mocked.post.mockResolvedValue({ data: { id: 'n' } });
    await expect(goalsApi.getAll()).resolves.toEqual([{ id: 'g' }]);
    await expect(goalsApi.create({ name: 'Viagem', targetCents: 100 })).resolves.toEqual({ id: 'n' });
    expect(mocked.get).toHaveBeenCalledWith('/goals');
    expect(mocked.post).toHaveBeenCalledWith('/goals', { name: 'Viagem', targetCents: 100 });
  });

  it('adds progress, completes and removes', async () => {
    mocked.put.mockResolvedValue({ data: { id: 'g' } });
    mocked.delete.mockResolvedValue({});
    await expect(goalsApi.addProgress('g', 500)).resolves.toEqual({ id: 'g' });
    await expect(goalsApi.complete('g')).resolves.toEqual({ id: 'g' });
    await expect(goalsApi.remove('g')).resolves.toBeUndefined();
    expect(mocked.put).toHaveBeenCalledWith('/goals/g/progress', { amountCents: 500 });
    expect(mocked.put).toHaveBeenCalledWith('/goals/g/complete');
    expect(mocked.delete).toHaveBeenCalledWith('/goals/g');
  });
});

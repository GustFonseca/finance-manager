import { http } from '@/lib/http';
import { categoriesApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);
const input = { name: 'Lazer', type: 'EXPENSE' as const, color: '#fff' };

describe('categoriesApi', () => {
  it('lists every category without a type', async () => {
    mocked.get.mockResolvedValue({ data: [] });
    await categoriesApi.getAll();
    expect(mocked.get).toHaveBeenCalledWith('/categories', { params: {} });
  });

  it('lists categories of one type', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 'c' }] });
    await expect(categoriesApi.getAll('INCOME')).resolves.toEqual([{ id: 'c' }]);
    expect(mocked.get).toHaveBeenCalledWith('/categories', { params: { type: 'INCOME' } });
  });

  it('creates, updates and removes', async () => {
    mocked.post.mockResolvedValue({ data: { id: 'n' } });
    mocked.put.mockResolvedValue({ data: { id: 'u' } });
    mocked.delete.mockResolvedValue({});
    await expect(categoriesApi.create(input)).resolves.toEqual({ id: 'n' });
    await expect(categoriesApi.update('c', input)).resolves.toEqual({ id: 'u' });
    await expect(categoriesApi.remove('c')).resolves.toBeUndefined();
    expect(mocked.post).toHaveBeenCalledWith('/categories', input);
    expect(mocked.put).toHaveBeenCalledWith('/categories/c', input);
    expect(mocked.delete).toHaveBeenCalledWith('/categories/c');
  });
});

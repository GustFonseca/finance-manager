import { http } from '@/lib/http';
import { accountsApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

describe('accountsApi', () => {
  it('lists accounts', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 'a' }] });
    await expect(accountsApi.getAll()).resolves.toEqual([{ id: 'a' }]);
    expect(mocked.get).toHaveBeenCalledWith('/accounts');
  });

  it('creates an account', async () => {
    mocked.post.mockResolvedValue({ data: { id: 'a' } });
    await expect(accountsApi.create('Nubank')).resolves.toEqual({ id: 'a' });
    expect(mocked.post).toHaveBeenCalledWith('/accounts', { name: 'Nubank' });
  });

  it('updates an account', async () => {
    mocked.put.mockResolvedValue({ data: { id: 'a' } });
    await expect(accountsApi.update('a', 'Inter')).resolves.toEqual({ id: 'a' });
    expect(mocked.put).toHaveBeenCalledWith('/accounts/a', { name: 'Inter' });
  });

  it('removes an account', async () => {
    mocked.delete.mockResolvedValue({});
    await expect(accountsApi.remove('a')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/accounts/a');
  });
});

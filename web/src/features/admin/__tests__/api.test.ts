import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { adminApi } from '../api';
import { users } from './fixtures';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('adminApi', () => {
  it('lists the users overview', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse(users));

    await expect(adminApi.getUsers()).resolves.toEqual(users);
    expect(http.get).toHaveBeenCalledWith('/admin/users');
  });
});

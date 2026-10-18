import { http } from '@/lib/http';
import { challengesApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

const input = { name: 'Sem delivery', scope: 'SUPERFLUOUS' as const, targetId: null, limitCents: 0, startsOn: 's', days: 7 };

describe('challengesApi', () => {
  it('lists and creates challenges', async () => {
    mocked.get.mockResolvedValue(httpResponse([{ id: 'c' }]));
    mocked.post.mockResolvedValue(httpResponse({ id: 'n' }));
    await expect(challengesApi.getAll()).resolves.toEqual([{ id: 'c' }]);
    await expect(challengesApi.create(input)).resolves.toEqual({ id: 'n' });
    expect(mocked.get).toHaveBeenCalledWith('/challenges');
    expect(mocked.post).toHaveBeenCalledWith('/challenges', input);
  });

  it('removes a challenge', async () => {
    mocked.delete.mockResolvedValue(httpResponse('ignored'));
    await expect(challengesApi.remove('c1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/challenges/c1');
  });
});

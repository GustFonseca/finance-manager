import { http } from '@/lib/http';
import { profileApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('profileApi', () => {
  it('gets the signed in user profile', async () => {
    const profile = { email: 'g@x.com', name: 'Gustavo', isAdmin: true };
    jest.mocked(http.get).mockResolvedValue(httpResponse(profile));

    await expect(profileApi.get()).resolves.toEqual(profile);
    expect(http.get).toHaveBeenCalledWith('/me');
  });
});

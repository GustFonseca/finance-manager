import { http } from '@/lib/http';
import { profileApi } from '../api';
import { httpResponse } from '@/test/http';
import { profile, profileUpdate } from './fixtures';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), put: jest.fn() } }));

describe('profileApi', () => {
  it('gets the signed in user profile', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse(profile()));

    await expect(profileApi.get()).resolves.toEqual(profile());
    expect(http.get).toHaveBeenCalledWith('/me');
  });

  it('saves the profile and returns the stored version', async () => {
    const saved = profile({ name: 'Gustavo F' });
    jest.mocked(http.put).mockResolvedValue(httpResponse(saved));

    await expect(profileApi.update(profileUpdate())).resolves.toEqual(saved);
    expect(http.put).toHaveBeenCalledWith('/me', profileUpdate());
  });
});

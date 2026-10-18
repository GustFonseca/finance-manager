import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { wishlistApi } from '../api';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

const mocked = jest.mocked(http);

describe('wishlistApi', () => {
  it('loads the list and adds a wish', async () => {
    mocked.get.mockResolvedValue(httpResponse({ items: [] }));
    mocked.post.mockResolvedValue(httpResponse({ id: 'w1' }));
    const input = { name: 'Fone', priceCents: 100, link: null };

    await expect(wishlistApi.get()).resolves.toEqual({ items: [] });
    await expect(wishlistApi.create(input)).resolves.toEqual({ id: 'w1' });
    expect(mocked.get).toHaveBeenCalledWith('/wishlist');
    expect(mocked.post).toHaveBeenCalledWith('/wishlist', input);
  });

  it('decides and removes a wish', async () => {
    mocked.put.mockResolvedValue(httpResponse({ id: 'w1', status: 'GAVE_UP' }));
    mocked.delete.mockResolvedValue(httpResponse(undefined));

    await expect(wishlistApi.decide('w1', 'GAVE_UP')).resolves.toEqual({ id: 'w1', status: 'GAVE_UP' });
    await expect(wishlistApi.remove('w1')).resolves.toBeUndefined();
    expect(mocked.put).toHaveBeenCalledWith('/wishlist/w1/decision', { status: 'GAVE_UP' });
    expect(mocked.delete).toHaveBeenCalledWith('/wishlist/w1');
  });
});

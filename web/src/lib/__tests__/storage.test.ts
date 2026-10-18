import { deleteItem, getItem, setItem } from '../storage';

describe('storage', () => {
  it('saves, reads and removes values', async () => {
    expect(await getItem('k')).toBeNull();

    await setItem('k', 'v');
    expect(await getItem('k')).toBe('v');

    await deleteItem('k');
    expect(await getItem('k')).toBeNull();
  });
});

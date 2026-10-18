import { queryKeys } from '../queryKeys';

describe('queryKeys', () => {
  it('gives every resource its own key', () => {
    const keys = Object.values(queryKeys).map((key) => key[0]);

    expect(new Set(keys).size).toBe(keys.length);
    expect(queryKeys.activity).toEqual(['activity']);
  });
});

import { queryKeys } from '../queryKeys';

describe('queryKeys', () => {
  it('gives every resource its own key', () => {
    const keys = Object.values(queryKeys).map((key) => key.join('/'));

    expect(new Set(keys).size).toBe(keys.length);
    expect(queryKeys.activity).toEqual(['activity']);
    expect(queryKeys.challenges).toEqual(['challenges']);
    expect(queryKeys.profile).toEqual(['profile']);
    expect(queryKeys.rules).toEqual(['rules']);
  });

  it('nests the avoidable spending under the summary so summary invalidation refreshes it', () => {
    expect(queryKeys.avoidable).toEqual(['summary', 'avoidable']);
    expect(queryKeys.avoidable[0]).toBe(queryKeys.summary[0]);
  });
});

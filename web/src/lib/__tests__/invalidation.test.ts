import { createTestQueryClient } from '@/test/render';
import {
  AFFECTED_KEYS,
  invalidateCategories,
  invalidateChallenges,
  invalidateDebts,
  invalidateEmergencyFund,
  invalidateFiles,
  invalidateGoals,
  invalidateInsights,
  invalidateMoney,
  invalidateRules,
  invalidateSavingsPlan,
  invalidateWishlist,
} from '../invalidation';
import { queryKeys } from '../queryKeys';

function invalidatedBy(run: (qc: ReturnType<typeof createTestQueryClient>) => void) {
  const client = createTestQueryClient();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  run(client);
  return invalidate.mock.calls.map(([filter]) => filter?.queryKey);
}

const MONEY = [['transactions'], ['accounts'], ['summary'], ['savings'], ['merchants'], ['challenges'], ['wishlist']];

describe('invalidation', () => {
  it('refreshes everything that depends on money, including the wishlist and challenges', () => {
    expect(invalidatedBy(invalidateMoney)).toEqual(MONEY);
  });

  it('refreshes categories together with the money queries', () => {
    expect(invalidatedBy(invalidateCategories)).toEqual([['categories'], ...MONEY]);
  });

  it('refreshes goals and the summary when a goal changes', () => {
    expect(invalidatedBy(invalidateGoals)).toEqual([['goals'], ['summary']]);
  });

  it('refreshes savings, summary and wishlist when the savings plan changes', () => {
    expect(invalidatedBy(invalidateSavingsPlan)).toEqual([['savings'], ['summary'], ['wishlist']]);
  });

  it('also refreshes goals when the emergency fund changes', () => {
    expect(invalidatedBy(invalidateEmergencyFund)).toEqual([['savings'], ['summary'], ['wishlist'], ['goals']]);
  });

  it('refreshes debts and the summary when a debt changes', () => {
    expect(invalidatedBy(invalidateDebts)).toEqual([['debts'], ['summary']]);
  });

  it('refreshes folders, files and trash when a file changes', () => {
    expect(invalidatedBy(invalidateFiles)).toEqual([['folders'], ['files'], ['trash']]);
  });

  it('refreshes single-domain lists on their own', () => {
    expect(invalidatedBy(invalidateWishlist)).toEqual([['wishlist']]);
    expect(invalidatedBy(invalidateChallenges)).toEqual([['challenges']]);
    expect(invalidatedBy(invalidateInsights)).toEqual([['summary']]);
  });

  it('refreshes every resource but the profile and files when a rule changes', () => {
    const refreshed = invalidatedBy(invalidateRules).map((key) => key!.join('/'));
    const expected = Object.values(queryKeys)
      .filter((key) => key.length === 1)
      .map((key) => key.join('/'))
      .filter((key) => !['profile', 'folders', 'files', 'trash'].includes(key));

    expect([...refreshed].sort()).toEqual([...expected].sort());
  });

  it('only lists keys that exist in queryKeys', () => {
    const known = new Set(Object.values(queryKeys).map((key) => key.join('/')));
    for (const keys of Object.values(AFFECTED_KEYS)) {
      for (const key of keys) expect(known.has(key.join('/'))).toBe(true);
    }
  });
});

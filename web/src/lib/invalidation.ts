import { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type InvalidationDomain =
  | 'money'
  | 'categories'
  | 'goals'
  | 'savingsPlan'
  | 'emergencyFund'
  | 'debts'
  | 'files'
  | 'rules'
  | 'wishlist'
  | 'challenges'
  | 'insights';

const MONEY: readonly QueryKey[] = [
  queryKeys.transactions,
  queryKeys.accounts,
  queryKeys.summary,
  queryKeys.savings,
  queryKeys.merchants,
  queryKeys.challenges,
  queryKeys.wishlist,
];

const SAVINGS_PLAN: readonly QueryKey[] = [queryKeys.savings, queryKeys.summary, queryKeys.wishlist];

export const AFFECTED_KEYS: Record<InvalidationDomain, readonly QueryKey[]> = {
  money: MONEY,
  categories: [queryKeys.categories, ...MONEY],
  goals: [queryKeys.goals, queryKeys.summary],
  savingsPlan: SAVINGS_PLAN,
  emergencyFund: [...SAVINGS_PLAN, queryKeys.goals],
  debts: [queryKeys.debts, queryKeys.summary],
  files: [queryKeys.folders, queryKeys.files, queryKeys.trash],
  rules: [
    queryKeys.rules,
    queryKeys.categories,
    queryKeys.goals,
    queryKeys.debts,
    queryKeys.activity,
    ...MONEY,
  ],
  wishlist: [queryKeys.wishlist],
  challenges: [queryKeys.challenges],
  insights: [queryKeys.summary],
};

export function invalidateDomain(qc: QueryClient, domain: InvalidationDomain): void {
  for (const queryKey of AFFECTED_KEYS[domain]) qc.invalidateQueries({ queryKey });
}

export const invalidateMoney = (qc: QueryClient) => invalidateDomain(qc, 'money');
export const invalidateCategories = (qc: QueryClient) => invalidateDomain(qc, 'categories');
export const invalidateGoals = (qc: QueryClient) => invalidateDomain(qc, 'goals');
export const invalidateSavingsPlan = (qc: QueryClient) => invalidateDomain(qc, 'savingsPlan');
export const invalidateEmergencyFund = (qc: QueryClient) => invalidateDomain(qc, 'emergencyFund');
export const invalidateDebts = (qc: QueryClient) => invalidateDomain(qc, 'debts');
export const invalidateFiles = (qc: QueryClient) => invalidateDomain(qc, 'files');
export const invalidateRules = (qc: QueryClient) => invalidateDomain(qc, 'rules');
export const invalidateWishlist = (qc: QueryClient) => invalidateDomain(qc, 'wishlist');
export const invalidateChallenges = (qc: QueryClient) => invalidateDomain(qc, 'challenges');
export const invalidateInsights = (qc: QueryClient) => invalidateDomain(qc, 'insights');

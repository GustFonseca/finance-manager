import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { profileApi } from './api';

export const PROFILE_STALE_TIME_MS = 30 * 60_000;

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, staleTime: PROFILE_STALE_TIME_MS });
}

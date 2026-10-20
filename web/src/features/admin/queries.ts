import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { adminApi } from './api';

export function useUsersOverview() {
  return useQuery({ queryKey: queryKeys.adminUsers, queryFn: adminApi.getUsers });
}

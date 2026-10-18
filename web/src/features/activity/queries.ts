import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { activityApi } from './api';

export const ACTIVITY_PAGE_SIZE = 50;

export function useActivity() {
  return useInfiniteQuery({
    queryKey: queryKeys.activity,
    queryFn: ({ pageParam }) => activityApi.getPage(pageParam, ACTIVITY_PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === ACTIVITY_PAGE_SIZE ? lastPage[lastPage.length - 1].createdAt : undefined,
  });
}

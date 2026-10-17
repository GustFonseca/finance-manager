import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { activityApi } from './api';

export const ACTIVITY_PAGE_SIZE = 50;

/** The user's history, loaded a page at a time as the list scrolls. */
export function useActivity() {
  return useInfiniteQuery({
    queryKey: queryKeys.activity,
    queryFn: ({ pageParam }) => activityApi.getPage(pageParam, ACTIVITY_PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    // A full page means there may be older entries.
    getNextPageParam: (lastPage) =>
      lastPage.length === ACTIVITY_PAGE_SIZE ? lastPage[lastPage.length - 1].createdAt : undefined,
  });
}

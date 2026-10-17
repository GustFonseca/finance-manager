import { MutationCache, QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * App-wide React Query client. `refetchOnWindowFocus` replaces the manual
 * `useFocusEffect`/refresh boilerplate the screens used to carry: data is kept
 * fresh automatically when the user returns to the tab.
 */
export const queryClient: QueryClient = new QueryClient({
  // Every change the user makes is written to their history by the API, so
  // any successful mutation refreshes the event viewer.
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.activity }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

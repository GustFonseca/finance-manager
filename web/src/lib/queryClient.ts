import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query client. `refetchOnWindowFocus` replaces the manual
 * `useFocusEffect`/refresh boilerplate the screens used to carry: data is kept
 * fresh automatically when the user returns to the tab.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

import { MutationCache, QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export const queryClient: QueryClient = new QueryClient({
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

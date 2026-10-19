import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { profileApi } from './api';
import { UpdateProfileRequest } from './types';

export const PROFILE_STALE_TIME_MS = 30 * 60_000;

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, staleTime: PROFILE_STALE_TIME_MS });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: (request: UpdateProfileRequest) => profileApi.update(request),
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile, profile);
      return updateUser({ name: profile.name });
    },
  });
}

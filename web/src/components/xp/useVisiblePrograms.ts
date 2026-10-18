import { useMemo } from 'react';
import { useProfile } from '@/features/profile/queries';
import { visiblePrograms } from './programs';

export function useVisiblePrograms() {
  const isAdmin = useProfile().data?.isAdmin === true;
  return useMemo(() => visiblePrograms(isAdmin), [isAdmin]);
}

import { useMemo } from 'react';
import { useProfile } from '@/features/profile/queries';
import { desktopPrograms, visiblePrograms } from './programs';

export function useVisiblePrograms() {
  const isAdmin = useProfile().data?.isAdmin === true;
  return useMemo(() => visiblePrograms(isAdmin), [isAdmin]);
}

export function useDesktopPrograms() {
  const programs = useVisiblePrograms();
  return useMemo(() => desktopPrograms(programs), [programs]);
}

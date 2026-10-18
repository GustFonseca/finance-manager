import { http } from '@/lib/http';
import { ProfileDto } from './types';

export const profileApi = {
  get: () => http.get<ProfileDto>('/me').then((r) => r.data),
};

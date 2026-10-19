import { http } from '@/lib/http';
import { ProfileDto, UpdateProfileRequest } from './types';

export const profileApi = {
  get: () => http.get<ProfileDto>('/me').then((r) => r.data),
  update: (request: UpdateProfileRequest) => http.put<ProfileDto>('/me', request).then((r) => r.data),
};

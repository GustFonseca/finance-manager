import { http } from '@/lib/http';
import { UserOverviewDto } from './types';

export const adminApi = {
  getUsers: () => http.get<UserOverviewDto[]>('/admin/users').then((r) => r.data),
};

import { http } from '@/lib/http';
import { ActivityLogDto } from './types';

export const activityApi = {
  getPage: (before?: string, limit = 50) =>
    http.get<ActivityLogDto[]>('/activity', { params: { before, limit } }).then((r) => r.data),
};

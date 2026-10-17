import { http } from '@/lib/http';
import { ActivityLogDto } from './types';

export const activityApi = {
  /** Newest first; `before` (the oldest `createdAt` seen) loads the next page. */
  getPage: (before?: string, limit = 50) =>
    http.get<ActivityLogDto[]>('/activity', { params: { before, limit } }).then((r) => r.data),
};

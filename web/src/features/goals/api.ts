import { http } from '@/lib/http';
import { CreateGoalInput, GoalDto } from './types';

export const goalsApi = {
  getAll: () => http.get<GoalDto[]>('/goals').then((r) => r.data),
  create: (data: CreateGoalInput) => http.post<GoalDto>('/goals', data).then((r) => r.data),
  addProgress: (id: string, amountCents: number) =>
    http.put<GoalDto>(`/goals/${id}/progress`, { amountCents }).then((r) => r.data),
  complete: (id: string) => http.put<GoalDto>(`/goals/${id}/complete`).then((r) => r.data),
  remove: (id: string) => http.delete(`/goals/${id}`).then(() => undefined),
};

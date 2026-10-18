import { http } from '@/lib/http';
import { RuleDto, RuleInput, RuleTestDto } from './types';

export const rulesApi = {
  getAll: () => http.get<RuleDto[]>('/rules').then((r) => r.data),
  create: (data: RuleInput) => http.post<RuleDto>('/rules', data).then((r) => r.data),
  update: (id: string, data: RuleInput) => http.put<RuleDto>(`/rules/${id}`, data).then((r) => r.data),
  setActive: (id: string, isActive: boolean) =>
    http.put<RuleDto>(`/rules/${id}/active`, { isActive }).then((r) => r.data),
  test: (pattern: string) => http.post<RuleTestDto>('/rules/test', { pattern }).then((r) => r.data),
};

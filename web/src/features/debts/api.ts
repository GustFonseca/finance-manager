import { http } from '@/lib/http';
import { DebtDto, DebtInput, DebtPlanDto } from './types';

export const debtsApi = {
  getAll: () => http.get<DebtDto[]>('/debts').then((r) => r.data),
  create: (data: DebtInput) => http.post<DebtDto>('/debts', data).then((r) => r.data),
  update: (id: string, data: DebtInput) => http.put<DebtDto>(`/debts/${id}`, data).then((r) => r.data),
  remove: (id: string) => http.delete(`/debts/${id}`).then(() => undefined),
  plan: (extraCents: number) =>
    http.get<DebtPlanDto>('/debts/plan', { params: { extraCents } }).then((r) => r.data),
};

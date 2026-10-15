import { http } from '@/lib/http';
import { AccountDto } from './types';

export const accountsApi = {
  getAll: () => http.get<AccountDto[]>('/accounts').then((r) => r.data),
  create: (name: string) => http.post<AccountDto>('/accounts', { name }).then((r) => r.data),
  update: (id: string, name: string) =>
    http.put<AccountDto>(`/accounts/${id}`, { name }).then((r) => r.data),
  remove: (id: string) => http.delete(`/accounts/${id}`).then(() => undefined),
};

import { http } from '@/lib/http';
import { CategoryDto, CategoryInput, CategoryType } from './types';

export const categoriesApi = {
  getAll: (type?: CategoryType) =>
    http
      .get<CategoryDto[]>('/categories', { params: type ? { type } : {} })
      .then((r) => r.data),
  create: (data: CategoryInput) =>
    http.post<CategoryDto>('/categories', data).then((r) => r.data),
  update: (id: string, data: CategoryInput) =>
    http.put<CategoryDto>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => http.delete(`/categories/${id}`).then(() => undefined),
};

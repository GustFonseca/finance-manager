import { http } from '@/lib/http';
import { ChallengeDto, CreateChallengeInput } from './types';

export const challengesApi = {
  getAll: () => http.get<ChallengeDto[]>('/challenges').then((r) => r.data),
  create: (data: CreateChallengeInput) => http.post<ChallengeDto>('/challenges', data).then((r) => r.data),
  remove: (id: string) => http.delete(`/challenges/${id}`).then(() => undefined),
};

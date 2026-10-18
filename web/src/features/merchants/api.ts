import { http } from '@/lib/http';
import { DateRange, PeriodFilter } from '@/features/transactions/types';
import {
  MerchantDto,
  MerchantHistoryDto,
  MerchantMatchDto,
  MerchantSpendingReportDto,
  UpdateMerchantInput,
  UpdateMerchantResultDto,
} from './types';

export const merchantsApi = {
  getAll: () => http.get<MerchantDto[]>('/merchants').then((r) => r.data),
  /** The merchant of each description being imported, with the category used before. */
  resolve: (descriptions: string[]) =>
    http.post<MerchantMatchDto[]>('/merchants/resolve', { descriptions }).then((r) => r.data),
  update: (id: string, data: UpdateMerchantInput) =>
    http.put<UpdateMerchantResultDto>(`/merchants/${id}`, data).then((r) => r.data),
  /** Spending per merchant in a month or a year. */
  spending: ({ start, end, accountId }: PeriodFilter) =>
    http
      .get<MerchantSpendingReportDto>('/merchants/spending', { params: { start, end, accountId } })
      .then((r) => r.data),
  /** One merchant month by month, from the month of `start`. */
  history: (id: string, { start, end }: DateRange) =>
    http.get<MerchantHistoryDto>(`/merchants/${id}/history`, { params: { start, end } }).then((r) => r.data),
};

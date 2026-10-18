import { http } from '@/lib/http';
import { DateRange, PeriodFilter, TransactionType } from '@/features/transactions/types';
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
  resolve: (lines: { description: string; type: TransactionType }[]) =>
    http.post<MerchantMatchDto[]>('/merchants/resolve', { lines }).then((r) => r.data),
  update: (id: string, data: UpdateMerchantInput) =>
    http.put<UpdateMerchantResultDto>(`/merchants/${id}`, data).then((r) => r.data),
  spending: ({ start, end, accountId }: PeriodFilter) =>
    http
      .get<MerchantSpendingReportDto>('/merchants/spending', { params: { start, end, accountId } })
      .then((r) => r.data),
  history: (id: string, { start, end }: DateRange) =>
    http.get<MerchantHistoryDto>(`/merchants/${id}/history`, { params: { start, end } }).then((r) => r.data),
};

import { http } from '@/lib/http';
import { SpendingClass } from '@/features/spending/types';
import { DateRange, PeriodFilter, TransactionType } from '@/features/transactions/types';
import {
  CompanyDto,
  MerchantDto,
  MerchantHistoryDto,
  MerchantMatchDto,
  MerchantSpendingDto,
  MerchantSpendingReportDto,
  UpdateMerchantInput,
  UpdateMerchantResultDto,
} from './types';

export const merchantsApi = {
  getAll: () => http.get<MerchantDto[]>('/merchants').then((r) => r.data),
  resolve: (lines: { description: string; type: TransactionType }[]) =>
    http.post<MerchantMatchDto[]>('/merchants/resolve', { lines }).then((r) => r.data),
  company: (cnpj: string) => http.get<CompanyDto>(`/merchants/company/${cnpj}`).then((r) => r.data),
  unsorted: ({ start, end }: DateRange) =>
    http.get<MerchantSpendingDto[]>('/merchants/unsorted', { params: { start, end } }).then((r) => r.data),
  setClass: (id: string, spendingClass: SpendingClass | null) =>
    http.put<MerchantDto>(`/merchants/${id}/class`, { class: spendingClass }).then((r) => r.data),
  update: (id: string, { class: spendingClass, ...data }: UpdateMerchantInput) =>
    http.put<UpdateMerchantResultDto>(`/merchants/${id}`, data).then(async (r) => {
      if (spendingClass === undefined) return r.data;
      const merchant = await merchantsApi.setClass(id, spendingClass);
      return { ...r.data, merchant };
    }),
  spending: ({ start, end, accountId }: PeriodFilter) =>
    http
      .get<MerchantSpendingReportDto>('/merchants/spending', { params: { start, end, accountId } })
      .then((r) => r.data),
  history: (id: string, { start, end }: DateRange) =>
    http.get<MerchantHistoryDto>(`/merchants/${id}/history`, { params: { start, end } }).then((r) => r.data),
};

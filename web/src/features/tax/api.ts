import { http } from '@/lib/http';
import { TaxReportDto } from './types';

export const taxApi = {
  report: (year: number) =>
    http.get<TaxReportDto>('/planning/tax-report', { params: { year } }).then((r) => r.data),
};

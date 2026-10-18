import { http } from '@/lib/http';
import { httpResponse } from '@/test/http';
import { taxApi } from '../api';
import { buildTaxSummary, formatDocument } from '../summary';
import { report } from './fixtures';

jest.mock('@/lib/http', () => ({ http: { get: jest.fn() } }));

describe('taxApi', () => {
  it('loads the report of a year', async () => {
    jest.mocked(http.get).mockResolvedValue(httpResponse({ year: 2025 }));
    await expect(taxApi.report(2025)).resolves.toEqual({ year: 2025 });
    expect(http.get).toHaveBeenCalledWith('/planning/tax-report', { params: { year: 2025 } });
  });
});

describe('formatDocument', () => {
  it('formats CPF and CNPJ and keeps other documents', () => {
    expect(formatDocument('12345678901')).toBe('CPF 123.456.789-01');
    expect(formatDocument('12.345.678/0001-90')).toBe('CNPJ 12.345.678/0001-90');
    expect(formatDocument('123')).toBe('123');
    expect(formatDocument(null)).toBe('documento não identificado');
  });
});

describe('buildTaxSummary', () => {
  it('writes a plain text summary of the year', () => {
    expect(buildTaxSummary(report())).toBe(
      [
        'Resumo para o Imposto de Renda — ano-calendário 2025',
        '',
        'Rendimentos recebidos: R$ 78.000,00',
        'Despesas no ano: R$ 54.000,00',
        'Possíveis deduções: R$ 6.500,00',
        '',
        'Rendimentos por fonte pagadora:',
        '- Empresa X (CNPJ 12.345.678/0001-90): R$ 72.000,00 em 12 lançamento(s)',
        '- Cliente Y (documento não identificado): R$ 6.000,00 em 2 lançamento(s)',
        '',
        'Despesas possivelmente dedutíveis:',
        'Saúde: R$ 4.500,00',
        '- Dra. Ana (CPF 123.456.789-01): R$ 3.000,00 em 6 lançamento(s)',
        '- Laboratório (123): R$ 1.500,00 em 1 lançamento(s)',
        'Educação: R$ 2.000,00',
        '- Escola (documento não identificado): R$ 2.000,00 em 10 lançamento(s)',
        '',
        'Confira os valores com os comprovantes e os limites oficiais da Receita Federal antes de declarar.',
      ].join('\n')
    );
  });

  it('mentions empty sections', () => {
    const text = buildTaxSummary(report({ incomes: [], deductibles: [] }));
    expect(text).toContain('- nenhum rendimento encontrado');
    expect(text).toContain('- nenhuma despesa dedutível encontrada');
  });
});

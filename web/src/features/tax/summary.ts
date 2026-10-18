import { formatCents } from '@/lib/money';
import { TaxParty, TaxReportDto } from './types';

export function formatDocument(document: string | null): string {
  if (!document) return 'documento não identificado';
  const digits = document.replace(/\D/g, '');
  if (digits.length === 11) return `CPF ${digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`;
  if (digits.length === 14) return `CNPJ ${digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}`;
  return document;
}

const money = (cents: number) => formatCents(cents).replace(/\s/g, ' ');

function partyLine(party: TaxParty): string {
  return `- ${party.name} (${formatDocument(party.document)}): ${money(party.cents)} em ${party.count} lançamento(s)`;
}

export function buildTaxSummary(report: TaxReportDto): string {
  const lines = [
    `Resumo para o Imposto de Renda — ano-calendário ${report.year}`,
    '',
    `Rendimentos recebidos: ${money(report.incomeCents)}`,
    `Despesas no ano: ${money(report.expenseCents)}`,
    `Possíveis deduções: ${money(report.deductibleCents)}`,
    '',
    'Rendimentos por fonte pagadora:',
    ...(report.incomes.length ? report.incomes.map(partyLine) : ['- nenhum rendimento encontrado']),
    '',
    'Despesas possivelmente dedutíveis:',
    ...(report.deductibles.length
      ? report.deductibles.flatMap((group) => [`${group.label}: ${money(group.cents)}`, ...group.providers.map(partyLine)])
      : ['- nenhuma despesa dedutível encontrada']),
    '',
    'Confira os valores com os comprovantes e os limites oficiais da Receita Federal antes de declarar.',
  ];
  return lines.join('\n');
}

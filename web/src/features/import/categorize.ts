import type { CategoryDto } from '@/features/categories/types';
import type { TransactionType } from '@/features/transactions/types';
import { normalizeText } from './text';

/**
 * Keyword → category name (as created for new users). A rule only applies
 * when the user still has a category with that name.
 */
const RULES: { category: string; pattern: RegExp }[] = [
  {
    category: 'alimentacao',
    pattern:
      /ifood|rappi|restaurante|lanchonete|padaria|mercado|supermercado|atacad|assai|carrefour|pao de acucar|hortifruti|acougue|pizza|burger|mcdonald|bk |subway|cafe|confeitaria/,
  },
  {
    category: 'transporte',
    pattern:
      /uber|\b99\b|99app|cabify|posto|combustivel|gasolina|shell|ipiranga|petrobras|estacionamento|sem parar|veloe|conectcar|metro|onibus|bilhete unico/,
  },
  {
    category: 'moradia',
    pattern:
      /aluguel|condominio|energia|enel|light|cemig|copel|sabesp|agua|comgas|internet|vivo|claro|\btim\b|\bnet\b|iptu/,
  },
  {
    category: 'saude',
    pattern: /farmacia|drogaria|drogasil|raia|pague menos|hospital|clinica|laboratorio|unimed|amil|odonto|academia|smart ?fit/,
  },
  {
    category: 'educacao',
    pattern: /escola|faculdade|universidade|curso|udemy|alura|coursera|livraria|material escolar/,
  },
  {
    category: 'lazer',
    pattern:
      /netflix|spotify|disney|hbo|max\.com|prime video|youtube|cinema|ingresso|steam|playstation|xbox|nintendo|show|teatro/,
  },
  { category: 'salario', pattern: /salario|folha de pagamento|pagamento de salario/ },
  { category: 'investimentos', pattern: /rendimento|resgate|cdb|tesouro|dividendo|juros/ },
];

/** Used when no rule matches. */
const FALLBACK_CATEGORY = 'outros';

/**
 * Suggests a category id for an imported line: keyword rule first, then
 * "Outros", then the first category of the right type.
 */
export function suggestCategory(
  description: string,
  type: TransactionType,
  categories: CategoryDto[]
): string | null {
  const ofType = categories.filter((category) => category.type === type);
  const byName = (name: string) => ofType.find((category) => normalizeText(category.name) === name);
  const text = normalizeText(description);

  for (const rule of RULES) {
    const category = rule.pattern.test(text) ? byName(rule.category) : undefined;
    if (category) return category.id;
  }
  return (byName(FALLBACK_CATEGORY) ?? ofType[0])?.id ?? null;
}

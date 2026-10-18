export type RuleType =
  | 'OWN_MONEY'
  | 'BRAND'
  | 'GATEWAY_PREFIX'
  | 'BUSINESS_WORD'
  | 'SUBSCRIPTION'
  | 'BILL'
  | 'GROCERY'
  | 'SUPERFLUOUS'
  | 'CATEGORY_HINT'
  | 'ESSENTIAL_CATEGORY'
  | 'SUPERFLUOUS_CATEGORY'
  | 'CATCH_ALL_CATEGORY'
  | 'SUBSCRIPTION_GROUP'
  | 'FEE';

export const TYPE_LABELS: Record<RuleType, string> = {
  OWN_MONEY: 'Dinheiro próprio',
  BRAND: 'Marca',
  GATEWAY_PREFIX: 'Prefixo de intermediador',
  BUSINESS_WORD: 'Palavra de empresa',
  SUBSCRIPTION: 'Assinatura',
  BILL: 'Conta fixa',
  GROCERY: 'Mercado',
  SUPERFLUOUS: 'Supérfluo',
  CATEGORY_HINT: 'Dica de categoria',
  ESSENTIAL_CATEGORY: 'Categoria essencial',
  SUPERFLUOUS_CATEGORY: 'Categoria supérflua',
  CATCH_ALL_CATEGORY: 'Categoria genérica',
  SUBSCRIPTION_GROUP: 'Grupo de assinaturas',
  FEE: 'Tarifa ou juros',
};

export const RULE_TYPES = Object.keys(TYPE_LABELS) as RuleType[];

export const TYPES_WITH_VALUE: ReadonlySet<RuleType> = new Set<RuleType>([
  'OWN_MONEY',
  'BRAND',
  'CATEGORY_HINT',
  'SUBSCRIPTION_GROUP',
  'FEE',
]);

export type RuleDto = {
  id: string;
  type: RuleType;
  pattern: string;
  value: string | null;
  priority: number;
  isActive: boolean;
  note: string | null;
  isDefault: boolean;
};

export type RuleInput = {
  type: RuleType;
  pattern: string;
  value: string | null;
  priority: number;
  note: string | null;
};

export type RuleTestDto = {
  valid: boolean;
  error: string | null;
  matchCount: number;
  checkedCount: number;
  samples: string[];
};

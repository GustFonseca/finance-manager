import { chart } from '@/theme';
import { SpendingClass } from './types';

export const SPENDING_CLASSES: { class: SpendingClass; label: string; color: string }[] = [
  { class: 'ESSENTIAL', label: 'Essencial', color: chart.essential },
  { class: 'VARIABLE', label: 'Variável', color: chart.variable },
  { class: 'SUPERFLUOUS', label: 'Supérfluo', color: chart.superfluous },
];

export const classInfo = (value: SpendingClass) => SPENDING_CLASSES.find((c) => c.class === value) ?? SPENDING_CLASSES[1];

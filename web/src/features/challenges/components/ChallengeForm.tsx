import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { DialogButtons, FormError, Input, Modal, RadioGroup, Select } from '@/components/ui';
import { useCategories } from '@/features/categories/queries';
import { useMerchants } from '@/features/merchants/queries';
import { INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { todayStartIso } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { ChallengeScope, CreateChallengeInput } from '../types';

export const MAX_CHALLENGE_DAYS = 90;
export const CHALLENGE_NAME_REQUIRED = 'Dê um nome ao desafio.';
export const CHALLENGE_TARGET_REQUIRED = 'Escolha onde o desafio vale.';
export const CHALLENGE_DAYS_INVALID = `O desafio deve durar de 1 a ${MAX_CHALLENGE_DAYS} dias.`;

const SCOPES = [
  { value: 'SUPERFLUOUS' as const, label: 'Gastos supérfluos' },
  { value: 'CATEGORY' as const, label: 'Uma categoria' },
  { value: 'MERCHANT' as const, label: 'Um estabelecimento' },
];

type Props = {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeInput) => void;
};

function parseLimit(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '' || /^0+([.,]0+)?$/.test(trimmed)) return 0;
  return parseToCents(trimmed);
}

export function ChallengeForm({ visible, saving, onClose, onSubmit }: Props) {
  const { data: categories = [] } = useCategories('EXPENSE');
  const { data: merchants = [] } = useMerchants();
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ChallengeScope>('SUPERFLUOUS');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [limit, setLimit] = useState('');
  const [days, setDays] = useState('7');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setScope('SUPERFLUOUS');
    setTargetId(null);
    setLimit('');
    setDays('7');
    setError(null);
  }, [visible]);

  function changeScope(value: ChallengeScope) {
    setScope(value);
    setTargetId(null);
  }

  function handleSubmit() {
    const limitCents = parseLimit(limit);
    const dayCount = Number(days.trim());
    const problem =
      !name.trim() ? CHALLENGE_NAME_REQUIRED
      : scope !== 'SUPERFLUOUS' && !targetId ? CHALLENGE_TARGET_REQUIRED
      : limitCents === null ? INVALID_AMOUNT_MESSAGE
      : !/^\d+$/.test(days.trim()) || dayCount < 1 || dayCount > MAX_CHALLENGE_DAYS ? CHALLENGE_DAYS_INVALID
      : null;
    setError(problem);
    if (problem) return;
    onSubmit({
      name: name.trim(),
      scope,
      targetId: scope === 'SUPERFLUOUS' ? null : targetId,
      limitCents: limitCents!,
      startsOn: todayStartIso(),
      days: dayCount,
    });
  }

  const options =
    scope === 'CATEGORY'
      ? categories.map((c) => ({ id: c.id, label: c.name }))
      : merchants.map((m) => ({ id: m.id, label: m.name }));

  return (
    <Modal visible={visible} onClose={onClose} icon="trophy" title="Novo desafio">
      <Input label="Nome do desafio:" placeholder="ex: 30 dias sem delivery" value={name} onChangeText={setName} />
      <Text style={styles.label}>Vale para:</Text>
      <RadioGroup options={SCOPES} value={scope} onChange={changeScope} />
      {scope !== 'SUPERFLUOUS' ? (
        <Select
          label={scope === 'CATEGORY' ? 'Categoria:' : 'Estabelecimento:'}
          options={options}
          selectedId={targetId}
          onSelect={setTargetId}
          placeholder="Escolha..."
        />
      ) : null}
      <Input
        label="Quanto pode gastar no período (vazio = nada):"
        placeholder="ex: 100,00"
        keyboardType="decimal-pad"
        value={limit}
        onChangeText={setLimit}
      />
      <Input label="Duração em dias:" keyboardType="number-pad" value={days} onChangeText={setDays} />
      <Text style={styles.hint}>O desafio começa hoje. A economia é estimada pelo seu ritmo de gastos dos 90 dias anteriores.</Text>
      <FormError message={error} />
      <DialogButtons confirmLabel="Começar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, DialogButtons, FormError, Input, Modal, Select } from '@/components/ui';
import { getErrorMessage } from '@/lib/http';
import { colors, fontSize, spacing } from '@/theme';
import { useTestRule } from '../queries';
import { RULE_TYPES, RuleDto, RuleInput, RuleTestDto, RuleType, TYPE_LABELS, TYPES_WITH_VALUE } from '../types';

export const DEFAULT_PRIORITY = 100;
export const RULE_PATTERN_REQUIRED = 'Informe o padrão (expressão regular).';
export const RULE_VALUE_REQUIRED = 'Este tipo de regra precisa de um valor.';
export const RULE_PRIORITY_INVALID = 'A prioridade deve ser um número inteiro.';

const TYPE_OPTIONS = RULE_TYPES.map((type) => ({ id: type, label: TYPE_LABELS[type] }));

type Props = {
  visible: boolean;
  rule?: RuleDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: RuleInput) => void;
};

type TestOutcome = { result: RuleTestDto } | { failure: string };

export function RuleForm({ visible, rule, saving, onClose, onSubmit }: Props) {
  const testRule = useTestRule();
  const [type, setType] = useState<RuleType>('SUPERFLUOUS');
  const [pattern, setPattern] = useState('');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState(String(DEFAULT_PRIORITY));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<TestOutcome | null>(null);

  useEffect(() => {
    if (!visible) return;
    setType(rule?.type ?? 'SUPERFLUOUS');
    setPattern(rule?.pattern ?? '');
    setValue(rule?.value ?? '');
    setPriority(String(rule?.priority ?? DEFAULT_PRIORITY));
    setNote(rule?.note ?? '');
    setError(null);
    setOutcome(null);
  }, [visible, rule]);

  const needsValue = TYPES_WITH_VALUE.has(type);

  function changePattern(text: string) {
    setPattern(text);
    setOutcome(null);
  }

  async function handleTest() {
    if (!pattern.trim()) {
      setError(RULE_PATTERN_REQUIRED);
      return;
    }
    setError(null);
    try {
      setOutcome({ result: await testRule.mutateAsync(pattern.trim()) });
    } catch (e) {
      setOutcome({ failure: getErrorMessage(e, 'Não foi possível testar o padrão') });
    }
  }

  function handleSubmit() {
    const problem =
      !pattern.trim() ? RULE_PATTERN_REQUIRED
      : needsValue && !value.trim() ? RULE_VALUE_REQUIRED
      : !/^-?\d+$/.test(priority.trim()) ? RULE_PRIORITY_INVALID
      : null;
    setError(problem);
    if (problem) return;
    onSubmit({
      type,
      pattern: pattern.trim(),
      value: value.trim() || null,
      priority: Number(priority.trim()),
      note: note.trim() || null,
    });
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      icon="sliders"
      width={520}
      title={rule ? 'Editar regra' : 'Nova regra'}>
      <Select label="Tipo:" options={TYPE_OPTIONS} selectedId={type} onSelect={(id) => setType(id as RuleType)} />
      <Input
        label="Padrão (expressão regular):"
        placeholder="ex: \bifood\b"
        value={pattern}
        onChangeText={changePattern}
        autoCapitalize="none"
      />
      <View style={styles.testRow}>
        <Button size="sm" variant="secondary" label="Testar" onPress={handleTest} loading={testRule.isPending} />
        <TestResult outcome={outcome} />
      </View>
      <Input
        label={needsValue ? 'Valor (obrigatório para este tipo):' : 'Valor (opcional):'}
        value={value}
        onChangeText={setValue}
      />
      <Input label="Prioridade:" keyboardType="number-pad" value={priority} onChangeText={setPriority} />
      <Input label="Observação:" value={note} onChangeText={setNote} />
      <FormError message={error} />
      <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

function TestResult({ outcome }: { outcome: TestOutcome | null }) {
  if (!outcome) return null;
  if ('failure' in outcome) return <Text style={styles.testError}>{outcome.failure}</Text>;
  const { result } = outcome;
  if (!result.valid) return <Text style={styles.testError}>Padrão inválido: {result.error}</Text>;
  return (
    <View style={styles.testResult}>
      <Text style={styles.testCount}>
        {result.matchCount} de {result.checkedCount} descrições dos últimos 12 meses
      </Text>
      {result.samples.map((sample, index) => (
        <Text key={`${index}-${sample}`} style={styles.sample} numberOfLines={1}>
          {sample}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  testRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
  testResult: { flex: 1, gap: 2 },
  testCount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  testError: { flex: 1, fontSize: fontSize.sm, color: colors.expense },
  sample: { fontSize: fontSize.xs, color: colors.textSecondary },
});

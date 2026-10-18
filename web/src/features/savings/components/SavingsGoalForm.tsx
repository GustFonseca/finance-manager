import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { formatCents, formatCentsForInput, INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';

type Props = {
  visible: boolean;
  currentCents: number;
  averageSavedCents: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (cents: number) => void;
};

export function SavingsGoalForm({ visible, currentCents, averageSavedCents, saving, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setAmount(currentCents ? formatCentsForInput(currentCents) : '');
  }, [visible, currentCents]);

  function handleSubmit() {
    const cents = parseToCents(amount);
    setError(cents === null ? INVALID_AMOUNT_MESSAGE : null);
    if (cents === null) return;
    onSubmit(cents);
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="flag" title="Meta de economia">
      <Input
        label="Quanto você quer economizar por mês?"
        placeholder="ex: 1000,00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        autoFocus
      />
      <Text style={styles.hint}>
        Nos últimos 3 meses você economizou, em média, {formatCents(averageSavedCents)} por mês.
      </Text>
      <FormError message={error} />
      <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
});

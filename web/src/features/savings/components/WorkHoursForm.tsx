import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';

export const MAX_WORK_HOURS = 744;
export const INVALID_HOURS_MESSAGE = `Informe um número inteiro de horas entre 1 e ${MAX_WORK_HOURS}.`;

type Props = {
  visible: boolean;
  currentHours: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (hours: number) => void;
};

export function WorkHoursForm({ visible, currentHours, saving, onClose, onSubmit }: Props) {
  const [hours, setHours] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setHours(String(currentHours));
  }, [visible, currentHours]);

  function handleSubmit() {
    const value = Number(hours.trim());
    const valid = /^\d+$/.test(hours.trim()) && value >= 1 && value <= MAX_WORK_HOURS;
    setError(valid ? null : INVALID_HOURS_MESSAGE);
    if (valid) onSubmit(value);
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="clock-o" title="Horas de trabalho">
      <Input
        label="Quantas horas você trabalha por mês?"
        placeholder="ex: 176"
        keyboardType="number-pad"
        value={hours}
        onChangeText={setHours}
        autoFocus
      />
      <Text style={styles.hint}>
        Usado para mostrar quanto tempo de trabalho cada gasto custa. 8 horas por dia em 22 dias úteis dá 176 horas.
      </Text>
      <FormError message={error} />
      <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
});

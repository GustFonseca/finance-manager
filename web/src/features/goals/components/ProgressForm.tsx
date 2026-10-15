import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Modal } from '@/components/ui';
import { parseToCents } from '@/lib/money';
import { spacing } from '@/theme';
import { GoalDto } from '../types';

type Props = {
  goal: GoalDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (amountCents: number) => void;
};

export function ProgressForm({ goal, saving, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (goal) setAmount('');
  }, [goal]);

  function handleSubmit() {
    const amountCents = parseToCents(amount);
    if (amountCents === null) return;
    onSubmit(amountCents);
  }

  return (
    <Modal
      visible={!!goal}
      onClose={onClose}
      title={goal ? `Adicionar Valor — ${goal.name}` : ''}>
      <Input
        placeholder="Valor (ex: 100,00)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        autoFocus
      />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onClose} style={styles.grow} />
        <Button label="Adicionar" onPress={handleSubmit} loading={saving} style={styles.grow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  grow: { flex: 1 },
});

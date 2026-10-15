import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Modal } from '@/components/ui';
import { parseToCents } from '@/lib/money';
import { spacing } from '@/theme';
import { CreateGoalInput } from '../types';

type Props = {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => void;
};

export function GoalForm({ visible, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setTarget('');
    }
  }, [visible]);

  function handleSubmit() {
    const targetCents = parseToCents(target);
    if (!name.trim() || targetCents === null) return;
    onSubmit({ name: name.trim(), targetCents });
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Nova Meta">
      <Input placeholder="Nome da meta" value={name} onChangeText={setName} />
      <Input
        placeholder="Valor alvo (ex: 5000,00)"
        keyboardType="decimal-pad"
        value={target}
        onChangeText={setTarget}
      />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onClose} style={styles.grow} />
        <Button label="Criar" onPress={handleSubmit} loading={saving} style={styles.grow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  grow: { flex: 1 },
});

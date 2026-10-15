import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Modal } from '@/components/ui';
import { spacing } from '@/theme';
import { AccountDto } from '../types';

type Props = {
  visible: boolean;
  account?: AccountDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AccountForm({ visible, account, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) setName(account?.name ?? '');
  }, [visible, account]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <Modal visible={visible} onClose={onClose} title={account ? 'Editar Conta' : 'Nova Conta'}>
      <Input placeholder="Nome" value={name} onChangeText={setName} autoFocus />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onClose} style={styles.grow} />
        <Button label="Salvar" onPress={handleSubmit} loading={saving} style={styles.grow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  grow: { flex: 1 },
});

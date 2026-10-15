import React, { useEffect, useState } from 'react';
import { DialogButtons, Input, Modal } from '@/components/ui';
import { parseToCents } from '@/lib/money';
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
    <Modal visible={visible} onClose={onClose} icon="bullseye" title="Nova Meta">
      <Input label="Nome da meta:" value={name} onChangeText={setName} />
      <Input
        label="Valor alvo:"
        placeholder="ex: 5000,00"
        keyboardType="decimal-pad"
        value={target}
        onChangeText={setTarget}
      />
      <DialogButtons
        confirmLabel="Criar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

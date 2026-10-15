import React, { useEffect, useState } from 'react';
import { DialogButtons, Input, Modal } from '@/components/ui';
import { parseToCents } from '@/lib/money';
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
      icon="bullseye"
      title={goal ? `Adicionar Valor — ${goal.name}` : ''}>
      <Input
        label="Valor:"
        placeholder="ex: 100,00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        autoFocus
      />
      <DialogButtons
        confirmLabel="Adicionar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

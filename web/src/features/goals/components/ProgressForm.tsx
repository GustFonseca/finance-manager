import React, { useEffect, useState } from 'react';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { GoalDto } from '../types';

type Props = {
  goal: GoalDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (amountCents: number) => void;
};

export function ProgressForm({ goal, saving, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!goal) return;
    setAmount('');
    setError(null);
  }, [goal]);

  function handleSubmit() {
    const amountCents = parseToCents(amount);
    const invalid = amountCents === null || amountCents <= 0;
    setError(invalid ? INVALID_AMOUNT_MESSAGE : null);
    if (invalid) return;
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
      <FormError message={error} />
      <DialogButtons
        confirmLabel="Adicionar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

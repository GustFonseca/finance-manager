import React, { useEffect, useState } from 'react';
import { DateInput, DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { dayToIso } from '@/lib/periods';
import { CreateGoalInput } from '../types';

type Props = {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput) => void;
};

export const GOAL_NAME_REQUIRED = 'Dê um nome para a meta.';

export function GoalForm({ visible, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setTarget('');
      setDeadline('');
      setError(null);
    }
  }, [visible]);

  function handleSubmit() {
    const targetCents = parseToCents(target);
    const problem =
      !name.trim() ? GOAL_NAME_REQUIRED
      : targetCents === null || targetCents <= 0 ? INVALID_AMOUNT_MESSAGE
      : null;
    setError(problem);
    if (problem) return;
    onSubmit({ name: name.trim(), targetCents: targetCents!, deadline: deadline ? dayToIso(deadline) : undefined });
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
      <DateInput label="Prazo (opcional):" value={deadline} onChange={setDeadline} />
      <FormError message={error} />
      <DialogButtons
        confirmLabel="Criar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

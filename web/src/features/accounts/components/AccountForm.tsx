import React, { useEffect, useState } from 'react';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { AccountDto } from '../types';

export const MAX_ACCOUNT_NAME_LENGTH = 100;
export const ACCOUNT_NAME_REQUIRED = 'Informe o nome da conta.';
export const ACCOUNT_NAME_TOO_LONG = `O nome da conta pode ter no máximo ${MAX_ACCOUNT_NAME_LENGTH} caracteres.`;

type Props = {
  visible: boolean;
  account?: AccountDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AccountForm({ visible, account, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(account?.name ?? '');
    setError(null);
  }, [visible, account]);

  function handleSubmit() {
    const trimmed = name.trim();
    const problem =
      !trimmed ? ACCOUNT_NAME_REQUIRED : trimmed.length > MAX_ACCOUNT_NAME_LENGTH ? ACCOUNT_NAME_TOO_LONG : null;
    setError(problem);
    if (problem) return;
    onSubmit(trimmed);
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      icon="bank"
      title={account ? 'Editar Conta' : 'Nova Conta'}>
      <Input label="Nome:" value={name} onChangeText={setName} autoFocus />
      <FormError message={error} />
      <DialogButtons
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

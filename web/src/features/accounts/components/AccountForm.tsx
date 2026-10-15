import React, { useEffect, useState } from 'react';
import { DialogButtons, Input, Modal } from '@/components/ui';
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
    <Modal
      visible={visible}
      onClose={onClose}
      icon="bank"
      title={account ? 'Editar Conta' : 'Nova Conta'}>
      <Input label="Nome:" value={name} onChangeText={setName} autoFocus />
      <DialogButtons
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

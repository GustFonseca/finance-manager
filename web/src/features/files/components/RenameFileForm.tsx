import React, { useEffect, useState } from 'react';
import { DialogButtons, Input, Modal } from '@/components/ui';
import { StoredFileDto } from '../types';

type Props = {
  file: StoredFileDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function RenameFileForm({ file, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (file) setName(file.name);
  }, [file]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <Modal visible={!!file} onClose={onClose} icon="pencil" title="Renomear">
      <Input label="Nome:" value={name} onChangeText={setName} autoFocus selectTextOnFocus />
      <DialogButtons confirmLabel="OK" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

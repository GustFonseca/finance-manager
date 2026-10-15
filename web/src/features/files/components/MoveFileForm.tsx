import React, { useEffect, useState } from 'react';
import { DialogButtons, Modal, Select } from '@/components/ui';
import { useFolders } from '../queries';
import { StoredFileDto } from '../types';

type Props = {
  file: StoredFileDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (folderId: string) => void;
};

/** "Mover para a pasta": picks any other folder of the desktop. */
export function MoveFileForm({ file, saving, onClose, onSubmit }: Props) {
  const { data: folders = [] } = useFolders();
  const targets = folders.filter((folder) => folder.id !== file?.folderId);
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (file) setFolderId(targets[0]?.id ?? null);
    // Preselects only when a file is chosen, so a refetch can't reset the user's pick.
  }, [file]);

  return (
    <Modal visible={!!file} onClose={onClose} icon="folder-open" title="Mover para a pasta">
      <Select
        label={`Mover "${file?.name ?? ''}" para:`}
        options={targets.map((folder) => ({ id: folder.id, label: folder.name }))}
        selectedId={folderId}
        onSelect={setFolderId}
      />
      <DialogButtons
        confirmLabel="Mover"
        onConfirm={() => folderId && onSubmit(folderId)}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

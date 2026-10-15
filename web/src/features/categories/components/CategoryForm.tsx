import React, { useEffect, useState } from 'react';
import {
  CATEGORY_COLORS,
  ColorPicker,
  DialogButtons,
  Input,
  Modal,
  RadioGroup,
} from '@/components/ui';
import { CategoryDto, CategoryInput, CategoryType } from '../types';

type Props = {
  visible: boolean;
  category?: CategoryDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryInput) => void;
};

export function CategoryForm({ visible, category, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (!visible) return;
    setName(category?.name ?? '');
    setType(category?.type ?? 'EXPENSE');
    setColor(category?.color ?? CATEGORY_COLORS[0]);
  }, [visible, category]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, type, color });
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      icon="tags"
      title={category ? 'Editar Categoria' : 'Nova Categoria'}>
      <Input label="Nome:" value={name} onChangeText={setName} />
      <RadioGroup
        value={type}
        onChange={setType}
        options={[
          { value: 'EXPENSE', label: 'Despesa' },
          { value: 'INCOME', label: 'Receita' },
        ]}
      />
      <ColorPicker label="Cor:" value={color} onChange={setColor} />
      <DialogButtons
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={saving}
      />
    </Modal>
  );
}

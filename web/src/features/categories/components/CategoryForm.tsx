import React, { useEffect, useState } from 'react';
import {
  CATEGORY_COLORS,
  ColorPicker,
  DialogButtons,
  FormError,
  Input,
  Modal,
  RadioGroup,
} from '@/components/ui';
import { CategoryDto, CategoryInput, CategoryType } from '../types';

export const MAX_CATEGORY_NAME_LENGTH = 100;
export const CATEGORY_NAME_REQUIRED = 'Informe o nome da categoria.';
export const CATEGORY_NAME_TOO_LONG = `O nome da categoria pode ter no máximo ${MAX_CATEGORY_NAME_LENGTH} caracteres.`;

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(category?.name ?? '');
    setType(category?.type ?? 'EXPENSE');
    setColor(category?.color ?? CATEGORY_COLORS[0]);
    setError(null);
  }, [visible, category]);

  function handleSubmit() {
    const trimmed = name.trim();
    const problem =
      !trimmed ? CATEGORY_NAME_REQUIRED : trimmed.length > MAX_CATEGORY_NAME_LENGTH ? CATEGORY_NAME_TOO_LONG : null;
    setError(problem);
    if (problem) return;
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

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  CATEGORY_COLORS,
  ColorPicker,
  Input,
  Modal,
  SegmentedControl,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
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
      title={category ? 'Editar Categoria' : 'Nova Categoria'}>
      <Input placeholder="Nome" value={name} onChangeText={setName} />
      <SegmentedControl
        value={type}
        onChange={setType}
        segments={[
          { value: 'EXPENSE', label: 'Despesa', activeColor: colors.expense },
          { value: 'INCOME', label: 'Receita', activeColor: colors.income },
        ]}
      />
      <ColorPicker label="Cor" value={color} onChange={setColor} />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onClose} style={styles.grow} />
        <Button label="Salvar" onPress={handleSubmit} loading={saving} style={styles.grow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  grow: { flex: 1 },
});

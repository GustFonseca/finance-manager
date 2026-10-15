import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListItem } from '@/components/ui';
import { colors, fontSize } from '@/theme';
import { CategoryDto } from '../types';

type Props = {
  category: CategoryDto;
  onPress: (category: CategoryDto) => void;
};

export function CategoryListItem({ category, onPress }: Props) {
  return (
    <ListItem onPress={() => onPress(category)}>
      <View style={[styles.swatch, { backgroundColor: category.color }]} />
      <Text style={styles.name}>{category.name}</Text>
      <Text style={styles.type}>{category.type === 'INCOME' ? 'Receita' : 'Despesa'}</Text>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 14, height: 14, borderWidth: 1, borderColor: '#808080' },
  name: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary },
  type: { width: 80, fontSize: fontSize.sm, color: colors.textSecondary },
});

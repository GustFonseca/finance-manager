import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { CategoryDto } from '../types';

type Props = {
  category: CategoryDto;
  onPress: (category: CategoryDto) => void;
};

export function CategoryListItem({ category, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(category)}>
      <Card style={styles.card}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
        <View style={styles.info}>
          <Text style={styles.name}>{category.name}</Text>
          <Text style={styles.type}>{category.type === 'INCOME' ? 'Receita' : 'Despesa'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  dot: { width: 16, height: 16, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '500', color: colors.textPrimary },
  type: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});

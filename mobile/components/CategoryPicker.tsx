import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CategoryDto } from '../services/api';

type Props = {
  categories: CategoryDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryPicker({ categories, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.chip,
            { borderColor: cat.color },
            selectedId === cat.id && { backgroundColor: cat.color },
          ]}
          onPress={() => onSelect(cat.id)}>
          <View style={[styles.dot, { backgroundColor: cat.color }]} />
          <Text style={[styles.text, selectedId === cat.id && styles.textActive]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontSize: 14 },
  textActive: { color: '#fff', fontWeight: '600' },
});

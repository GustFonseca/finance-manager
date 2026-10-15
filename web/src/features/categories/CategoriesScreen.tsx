import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { EmptyState, Fab, Screen, useDialog } from '@/components/ui';
import { getErrorMessage } from '@/lib/http';
import { spacing } from '@/theme';
import { CategoryForm } from './components/CategoryForm';
import { CategoryListItem } from './components/CategoryListItem';
import { useCategories, useDeleteCategory, useSaveCategory } from './queries';
import { CategoryDto, CategoryInput } from './types';

export function CategoriesScreen() {
  const { confirm, alert, menu } = useDialog();
  const { data: categories = [], isFetching, refetch } = useCategories();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(category: CategoryDto) {
    setEditing(category);
    setFormVisible(true);
  }

  async function handleSubmit(data: CategoryInput) {
    try {
      await saveCategory.mutateAsync({ id: editing?.id, data });
      setFormVisible(false);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar a categoria') });
    }
  }

  async function handleDelete(category: CategoryDto) {
    const ok = await confirm({
      title: 'Remover categoria',
      message: `Deseja remover "${category.name}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível remover') });
    }
  }

  function openOptions(category: CategoryDto) {
    menu({
      title: category.name,
      actions: [
        { label: 'Editar', onPress: () => openEdit(category) },
        { label: 'Remover', destructive: true, onPress: () => handleDelete(category) },
      ],
    });
  }

  return (
    <Screen>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <CategoryListItem category={item} onPress={openOptions} />}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState message="Nenhuma categoria" />}
      />

      <Fab onPress={openCreate} />

      <CategoryForm
        visible={formVisible}
        category={editing}
        saving={saveCategory.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
});

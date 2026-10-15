import React, { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
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
    <>
      <Window
        title="Categorias"
        icon="tags"
        actions={[{ label: 'Nova categoria', icon: 'plus-circle', onPress: openCreate }]}
        onRefresh={refetch}
        status={`${categories.length} categoria(s)`}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CategoryListItem category={item} onPress={openOptions} />}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState message="Nenhuma categoria" />}
        />
      </Window>

      <CategoryForm
        visible={formVisible}
        category={editing}
        saving={saveCategory.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { useContextMenu, Window } from '@/components/xp';
import type { IconName, MenuEntry } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { FileListItem } from './components/FileListItem';
import { fileIcon, formatBytes, formatDate } from './format';
import { useListSelection } from './hooks';
import { useDeleteForever, useEmptyTrash, useRestoreFromTrash, useTrash } from './queries';
import { palette } from '@/theme';

type TrashItem = {
  kind: 'folder' | 'file';
  id: string;
  name: string;
  icon: IconName;
  iconColor: string;
  origin: string;
  size: string;
  deletedAt: string | null;
};

export function TrashWindow() {
  const { confirm, alert } = useDialog();
  const contextMenu = useContextMenu();
  const { data: trash, isFetching, refetch } = useTrash();
  const emptyTrash = useEmptyTrash();
  const restore = useRestoreFromTrash();
  const deleteForever = useDeleteForever();
  const { selectedId, select, press } = useListSelection();

  const items: TrashItem[] = [
    ...(trash?.folders ?? []).map((folder) => ({
      kind: 'folder' as const,
      id: folder.id,
      name: folder.name,
      icon: 'folder' as const,
      iconColor: palette.amber,
      origin: 'Área de trabalho',
      size: `${folder.fileCount} arquivo(s)`,
      deletedAt: folder.deletedAt,
    })),
    ...(trash?.files ?? []).map((file) => {
      const { icon, color } = fileIcon(file.name);
      return {
        kind: 'file' as const,
        id: file.id,
        name: file.name,
        icon,
        iconColor: color,
        origin: file.folderName ?? '',
        size: formatBytes(file.sizeBytes),
        deletedAt: file.deletedAt,
      };
    }),
  ];

  async function run(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, failure) });
    }
  }

  async function handleDelete(item: TrashItem) {
    const ok = await confirm({
      title: item.kind === 'folder' ? 'Confirmar exclusão de pasta' : 'Confirmar exclusão de arquivo',
      message: `Tem certeza de que deseja excluir "${item.name}" permanentemente?`,
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
      destructive: true,
    });
    if (ok) run(() => deleteForever.mutateAsync(item), 'Não foi possível excluir o item');
  }

  async function handleEmpty() {
    if (items.length === 0) return;
    const ok = await confirm({
      title: 'Confirmar exclusão de vários arquivos',
      message: `Tem certeza de que deseja excluir permanentemente estes ${items.length} itens?`,
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
      destructive: true,
    });
    if (ok) run(() => emptyTrash.mutateAsync(), 'Não foi possível esvaziar a Lixeira');
  }

  const itemMenu = (item: TrashItem): MenuEntry[] => [
    { label: 'Restaurar', bold: true, onPress: () => run(() => restore.mutateAsync(item), 'Não foi possível restaurar') },
    'separator',
    { label: 'Excluir', onPress: () => handleDelete(item) },
  ];

  return (
    <Window
      title="Lixeira"
      icon={items.length ? 'trash' : 'trash-o'}
      actions={[{ label: 'Esvaziar Lixeira', icon: 'trash', onPress: handleEmpty }]}
      onRefresh={refetch}
      status={`${items.length} objeto(s)`}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.kind}:${item.id}`}
        renderItem={({ item }) => {
          const key = `${item.kind}:${item.id}`;
          return (
            <FileListItem
              icon={item.icon}
              iconColor={item.iconColor}
              name={item.name}
              detail={`Local original: ${item.origin}`}
              columns={[item.size, item.deletedAt ? formatDate(item.deletedAt) : '']}
              selected={selectedId === key}
              onPress={() => press(key)}
              onRightClick={(point) => {
                select(key);
                contextMenu.show(point, itemMenu(item));
              }}
            />
          );
        }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState message="A Lixeira está vazia." />}
      />
    </Window>
  );
}

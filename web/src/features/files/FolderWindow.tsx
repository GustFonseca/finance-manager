import React, { useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { onContextMenu, useContextMenu, Window } from '@/components/xp';
import type { MenuEntry } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { colors } from '@/theme';
import { filesApi } from './api';
import { FileListItem } from './components/FileListItem';
import { MoveFileForm } from './components/MoveFileForm';
import { RenameFileForm } from './components/RenameFileForm';
import { fileIcon, formatBytes, formatDate } from './format';
import { useFileDrop, useListSelection } from './hooks';
import { useFolderFiles, useTrashFile, useUpdateFile, useUploadFiles } from './queries';
import { FolderDto, StoredFileDto } from './types';

export function FolderWindow({ folder }: { folder: FolderDto }) {
  const { confirm, alert } = useDialog();
  const contextMenu = useContextMenu();
  const { data: files = [], isFetching, refetch } = useFolderFiles(folder.id);
  const uploadFiles = useUploadFiles();
  const updateFile = useUpdateFile();
  const trashFile = useTrashFile();
  const { selectedId, select, press } = useListSelection();

  const [renaming, setRenaming] = useState<StoredFileDto | null>(null);
  const [moving, setMoving] = useState<StoredFileDto | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(list: File[]) {
    if (list.length === 0) return;
    try {
      await uploadFiles.mutateAsync({ folderId: folder.id, files: list });
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível enviar os arquivos') });
    }
  }
  const drop = useFileDrop(upload);

  async function download(file: StoredFileDto) {
    try {
      window.location.href = await filesApi.downloadUrl(file.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível baixar o arquivo') });
    }
  }

  async function handleTrash(file: StoredFileDto) {
    const ok = await confirm({
      title: 'Confirmar exclusão de arquivo',
      message: `Tem certeza de que deseja enviar "${file.name}" para a Lixeira?`,
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
    });
    if (!ok) return;
    try {
      await trashFile.mutateAsync(file.id);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível excluir o arquivo') });
    }
  }

  async function handleUpdate(file: StoredFileDto, change: { name?: string; folderId?: string }) {
    try {
      await updateFile.mutateAsync({ id: file.id, ...change });
      setRenaming(null);
      setMoving(null);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível alterar o arquivo') });
    }
  }

  const fileMenu = (file: StoredFileDto): MenuEntry[] => [
    { label: 'Baixar', bold: true, onPress: () => download(file) },
    'separator',
    { label: 'Mover para a pasta...', onPress: () => setMoving(file) },
    { label: 'Renomear', onPress: () => setRenaming(file) },
    'separator',
    { label: 'Excluir', onPress: () => handleTrash(file) },
  ];

  const backgroundMenu: MenuEntry[] = [
    { label: 'Enviar arquivos...', onPress: () => fileInput.current?.click() },
    { label: 'Atualizar', onPress: refetch },
  ];

  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

  return (
    <>
      <Window
        title={folder.name}
        icon="folder-open"
        actions={[{ label: 'Enviar arquivos', icon: 'upload', onPress: () => fileInput.current?.click() }]}
        onRefresh={refetch}
        status={
          uploadFiles.isPending
            ? 'Enviando arquivos...'
            : `${files.length} objeto(s) · ${formatBytes(totalBytes)}`
        }>
        <View
          ref={drop.ref}
          style={[styles.content, drop.over && styles.dropTarget]}
          {...onContextMenu((point) => {
            select(null);
            contextMenu.show(point, backgroundMenu);
          })}>
          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const { icon, color } = fileIcon(item.name);
              return (
                <FileListItem
                  icon={icon}
                  iconColor={color}
                  name={item.name}
                  columns={[formatBytes(item.sizeBytes), formatDate(item.createdAt)]}
                  selected={selectedId === item.id}
                  onPress={() => press(item.id, () => download(item))}
                  onRightClick={(point) => {
                    select(item.id);
                    contextMenu.show(point, fileMenu(item));
                  }}
                />
              );
            }}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            ListEmptyComponent={
              <EmptyState message="Esta pasta está vazia. Arraste arquivos para cá ou use Enviar arquivos." />
            }
          />
        </View>
      </Window>

      <input
        ref={fileInput}
        type="file"
        multiple
        style={hiddenInput}
        onChange={(event) => {
          upload(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      <RenameFileForm
        file={renaming}
        saving={updateFile.isPending}
        onClose={() => setRenaming(null)}
        onSubmit={(name) => renaming && handleUpdate(renaming, { name })}
      />
      <MoveFileForm
        file={moving}
        saving={updateFile.isPending}
        onClose={() => setMoving(null)}
        onSubmit={(folderId) => moving && handleUpdate(moving, { folderId })}
      />
    </>
  );
}

const hiddenInput: React.CSSProperties = { display: 'none' };

const styles = StyleSheet.create({
  content: { flex: 1 },
  dropTarget: { backgroundColor: colors.hover, borderWidth: 2, borderColor: colors.selection, borderStyle: 'dashed' },
});

import React, { useEffect } from 'react';
import { useDialog } from '@/components/ui';
import {
  DesktopIcon,
  PROGRAMS,
  useDesktop,
  useDesktopMenu,
  useWindowManager,
  WindowIdProvider,
} from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { FolderWindow } from './FolderWindow';
import { folderWindowId, nextFolderName, TRASH_WINDOW_ID } from './format';
import { useCreateFolder, useEmptyTrash, useFolders, useRenameFolder, useTrash, useTrashFolder } from './queries';
import { TrashWindow } from './TrashWindow';
import { FolderDto } from './types';

const FOLDER_COLOR = '#E8B24A';
const TRASH_COLOR = '#455A64';

export function FileDesktop() {
  const wm = useWindowManager();
  const desktop = useDesktop();
  const { confirm, alert } = useDialog();
  const { data: folders = [], isSuccess: foldersLoaded } = useFolders();
  const { data: trash } = useTrash();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const trashFolder = useTrashFolder();
  const emptyTrash = useEmptyTrash();

  const trashCount = (trash?.folders.length ?? 0) + (trash?.files.length ?? 0);

  async function run(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, failure) });
    }
  }

  useDesktopMenu((point) => [
    {
      label: 'Nova pasta',
      onPress: () =>
        run(async () => {
          const folder = await createFolder.mutateAsync(nextFolderName(folders.map((f) => f.name)));
          const iconId = folderWindowId(folder.id);
          desktop.moveIcon(iconId, desktop.clampIcon(point));
          desktop.startRename(iconId);
        }, 'Não foi possível criar a pasta'),
    },
  ]);

  useEffect(() => {
    if (!foldersLoaded) return;
    const ids = new Set(folders.map((folder) => folderWindowId(folder.id)));
    wm.openWindows
      .filter((id) => id.startsWith('folder:') && !ids.has(id))
      .forEach((id) => wm.close(id));
  }, [foldersLoaded, folders, wm]);

  async function handleTrashFolder(folder: FolderDto) {
    const ok = await confirm({
      title: 'Confirmar exclusão de pasta',
      message: `Tem certeza de que deseja mover "${folder.name}" e todo o seu conteúdo para a Lixeira?`,
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
    });
    if (ok) run(() => trashFolder.mutateAsync(folder.id), 'Não foi possível excluir a pasta');
  }

  async function handleEmptyTrash() {
    const ok = await confirm({
      title: 'Confirmar exclusão de vários arquivos',
      message: `Tem certeza de que deseja excluir permanentemente estes ${trashCount} itens?`,
      confirmLabel: 'Sim',
      cancelLabel: 'Não',
      destructive: true,
    });
    if (ok) run(() => emptyTrash.mutateAsync(), 'Não foi possível esvaziar a Lixeira');
  }

  return (
    <>
      {folders.map((folder, index) => {
        const id = folderWindowId(folder.id);
        return (
          <DesktopIcon
            key={id}
            id={id}
            slot={PROGRAMS.length + index}
            label={folder.name}
            icon="folder"
            color={FOLDER_COLOR}
            onOpen={() => wm.open(id)}
            onRename={
              folder.isSystem
                ? undefined
                : (name) =>
                    run(() => renameFolder.mutateAsync({ id: folder.id, name }), 'Não foi possível renomear a pasta')
            }
            menu={() => [
              { label: 'Abrir', bold: true, onPress: () => wm.open(id) },
              'separator',
              { label: 'Renomear', disabled: folder.isSystem, onPress: () => desktop.startRename(id) },
              { label: 'Excluir', disabled: folder.isSystem, onPress: () => handleTrashFolder(folder) },
            ]}
          />
        );
      })}

      <DesktopIcon
        id={TRASH_WINDOW_ID}
        slot="bottom-right"
        label="Lixeira"
        icon={trashCount ? 'trash' : 'trash-o'}
        color={TRASH_COLOR}
        onOpen={() => wm.open(TRASH_WINDOW_ID)}
        menu={() => [
          { label: 'Abrir', bold: true, onPress: () => wm.open(TRASH_WINDOW_ID) },
          'separator',
          { label: 'Esvaziar Lixeira', disabled: trashCount === 0, onPress: handleEmptyTrash },
        ]}
      />

      {wm.openWindows.map((id) => {
        if (id === TRASH_WINDOW_ID) {
          return (
            <WindowIdProvider key={id} value={id}>
              <TrashWindow />
            </WindowIdProvider>
          );
        }
        const folder = folders.find((f) => folderWindowId(f.id) === id);
        return folder ? (
          <WindowIdProvider key={id} value={id}>
            <FolderWindow folder={folder} />
          </WindowIdProvider>
        ) : null;
      })}
    </>
  );
}

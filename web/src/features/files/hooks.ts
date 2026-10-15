import { useCallback, useRef, useState } from 'react';

const DOUBLE_CLICK_MS = 400;

/** Explorer list behaviour: a click selects the row, a second click on it opens it. */
export function useListSelection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastClick = useRef({ id: '', at: 0 });

  const press = useCallback((id: string, open?: () => void) => {
    const now = Date.now();
    const isDouble = lastClick.current.id === id && now - lastClick.current.at < DOUBLE_CLICK_MS;
    lastClick.current = isDouble ? { id: '', at: 0 } : { id, at: now };
    setSelectedId(id);
    if (isDouble) open?.();
  }, []);

  return { selectedId, select: setSelectedId, press };
}

/**
 * Accepts files dragged from the computer onto an element. Returns a callback
 * ref (react-native-web views are DOM elements) and whether a drag is over it.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;
  const cleanup = useRef<(() => void) | null>(null);

  const ref = useCallback((node: unknown) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!(node instanceof HTMLElement)) return;

    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files');
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setOver(true);
    };
    const onDragLeave = () => setOver(false);
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setOver(false);
      onFilesRef.current(Array.from(e.dataTransfer?.files ?? []));
    };

    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    cleanup.current = () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, []);

  return { ref, over };
}

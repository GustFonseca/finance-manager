import React from 'react';

export const CHUNK_RELOAD_KEY = 'fm_chunk_reload';

const CHUNK_ERROR =
  /loading (css )?chunk|dynamically imported module|importing a module script failed|error loading dynamically imported|failed to fetch dynamically/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'ChunkLoadError' || CHUNK_ERROR.test(error.message);
}

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) !== null;
  } catch {
    return true;
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    else sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {}
}

export async function importWithRetry<T>(load: () => Promise<T>): Promise<T> {
  let result: T;
  try {
    result = await load();
  } catch {
    try {
      result = await load();
    } catch (error) {
      if (!isChunkLoadError(error) || readFlag()) throw error;
      writeFlag(true);
      location.reload();
      return new Promise<T>(() => {});
    }
  }
  writeFlag(false);
  return result;
}

export function lazyWithRetry<P>(load: () => Promise<React.ComponentType<P>>) {
  return React.lazy(() => importWithRetry(load).then((Component) => ({ default: Component })));
}

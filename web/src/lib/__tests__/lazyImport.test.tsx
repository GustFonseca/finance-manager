import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { CHUNK_RELOAD_KEY, importWithRetry, isChunkLoadError, lazyWithRetry } from '../lazyImport';

const chunkError = () => Object.assign(new Error('Loading chunk 12 failed.'), { name: 'ChunkLoadError' });

function mockReload() {
  const original = window.location;
  const reload = jest.fn();
  Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });
  return { reload, restore: () => Object.defineProperty(window, 'location', { configurable: true, value: original }) };
}

describe('isChunkLoadError', () => {
  it('recognises the errors browsers raise for missing chunks', () => {
    expect(isChunkLoadError(chunkError())).toBe(true);
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
    expect(isChunkLoadError('Loading chunk 1 failed')).toBe(false);
  });
});

describe('importWithRetry', () => {
  let location: ReturnType<typeof mockReload>;

  beforeEach(() => {
    sessionStorage.clear();
    location = mockReload();
  });

  afterEach(() => location.restore());

  it('resolves on the first try and clears a previous reload flag', async () => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    await expect(importWithRetry(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
  });

  it('retries the import once', async () => {
    const load = jest.fn().mockRejectedValueOnce(chunkError()).mockResolvedValueOnce('ok');
    await expect(importWithRetry(load)).resolves.toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
    expect(location.reload).not.toHaveBeenCalled();
  });

  it('reloads the page once when the chunk is still missing', async () => {
    const load = jest.fn().mockRejectedValue(chunkError());
    let settled = false;
    importWithRetry(load).finally(() => (settled = true));
    await act(async () => {});

    expect(load).toHaveBeenCalledTimes(2);
    expect(location.reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('1');
    expect(settled).toBe(false);
  });

  it('gives up without reloading again after a reload already happened', async () => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    const error = chunkError();
    await expect(importWithRetry(jest.fn().mockRejectedValue(error))).rejects.toBe(error);
    expect(location.reload).not.toHaveBeenCalled();
  });

  it('rethrows other errors without reloading', async () => {
    const error = new Error('boom');
    await expect(importWithRetry(jest.fn().mockRejectedValue(error))).rejects.toBe(error);
    expect(location.reload).not.toHaveBeenCalled();
  });

  it('does not reload when the session storage is unavailable', async () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const error = chunkError();
    await expect(importWithRetry(jest.fn().mockRejectedValue(error))).rejects.toBe(error);
    await expect(importWithRetry(() => Promise.resolve(1))).resolves.toBe(1);
    expect(location.reload).not.toHaveBeenCalled();
    getItem.mockRestore();
    jest.restoreAllMocks();
  });
});

describe('lazyWithRetry', () => {
  it('renders the loaded component', async () => {
    const Lazy = lazyWithRetry(() => Promise.resolve(() => <span>tela</span>));
    render(
      <React.Suspense fallback={null}>
        <Lazy />
      </React.Suspense>
    );
    expect(await screen.findByText('tela')).toBeTruthy();
  });
});

import { http } from '@/lib/http';
import { filesApi, foldersApi, trashApi } from '../api';
import { httpResponse } from '@/test/http';

jest.mock('@/lib/http', () => ({
  http: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => {
  jest.mocked(http.get).mockResolvedValue(httpResponse('got'));
  jest.mocked(http.post).mockResolvedValue(httpResponse('posted'));
  jest.mocked(http.put).mockResolvedValue(httpResponse('put'));
  jest.mocked(http.delete).mockResolvedValue(httpResponse('deleted'));
});

describe('foldersApi', () => {
  it('lists, creates, renames and trashes folders', async () => {
    await expect(foldersApi.getAll()).resolves.toBe('got');
    expect(http.get).toHaveBeenCalledWith('/folders');
    await expect(foldersApi.create('Nova')).resolves.toBe('posted');
    expect(http.post).toHaveBeenCalledWith('/folders', { name: 'Nova' });
    await expect(foldersApi.rename('d1', 'Outra')).resolves.toBe('put');
    expect(http.put).toHaveBeenCalledWith('/folders/d1', { name: 'Outra' });
    await expect(foldersApi.trash('d1')).resolves.toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/folders/d1');
  });

  it('lists the files of a folder', async () => {
    await expect(foldersApi.getFiles('d1')).resolves.toBe('got');
    expect(http.get).toHaveBeenCalledWith('/folders/d1/files');
  });

  it('uploads files as multipart form data', async () => {
    const a = new File(['a'], 'a.txt');
    const b = new File(['b'], 'b.txt');
    await expect(foldersApi.upload('d1', [a, b])).resolves.toBe('posted');
    const [url, form, config] = jest.mocked(http.post).mock.calls[0] as [string, FormData, object?];
    expect(url).toBe('/folders/d1/files');
    expect(form.getAll('files')).toHaveLength(2);
    expect((form.getAll('files')[1] as File).name).toBe('b.txt');
    expect(config).toBeUndefined();
  });
});

describe('filesApi', () => {
  it('updates, trashes and gets the download url of a file', async () => {
    await expect(filesApi.update('f1', { name: 'x.pdf' })).resolves.toBe('put');
    expect(http.put).toHaveBeenCalledWith('/files/f1', { name: 'x.pdf' });
    await expect(filesApi.trash('f1')).resolves.toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/files/f1');
    jest.mocked(http.get).mockResolvedValue(httpResponse({ url: 'https://s3/x' }));
    await expect(filesApi.downloadUrl('f1')).resolves.toBe('https://s3/x');
    expect(http.get).toHaveBeenCalledWith('/files/f1/download');
  });
});

describe('trashApi', () => {
  it('reads, empties, restores and deletes items', async () => {
    await expect(trashApi.get()).resolves.toBe('got');
    expect(http.get).toHaveBeenCalledWith('/trash');
    await expect(trashApi.empty()).resolves.toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/trash');
    await expect(trashApi.restoreFolder('d1')).resolves.toBeUndefined();
    expect(http.post).toHaveBeenCalledWith('/trash/folders/d1/restore');
    await expect(trashApi.restoreFile('f1')).resolves.toBeUndefined();
    expect(http.post).toHaveBeenCalledWith('/trash/files/f1/restore');
    await expect(trashApi.deleteFolder('d1')).resolves.toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/trash/folders/d1');
    await expect(trashApi.deleteFile('f1')).resolves.toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/trash/files/f1');
  });
});

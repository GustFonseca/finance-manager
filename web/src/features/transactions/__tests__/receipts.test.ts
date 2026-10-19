import { foldersApi } from '@/features/files/api';
import { RECEIPTS_FOLDER, uploadReceipt } from '../receipts';

jest.mock('@/features/files/api');

const folders = jest.mocked(foldersApi);
const folder = (id: string, name: string) => ({ id, name, isSystem: false, fileCount: 0, createdAt: '' });
const file = new File(['x'], 'nota.jpg');

beforeEach(() => {
  folders.upload.mockResolvedValue([{ id: 'f1' }] as never);
});

describe('uploadReceipt', () => {
  it('reuses the receipts folder ignoring case and accents', async () => {
    folders.getAll.mockResolvedValue([folder('fo0', 'Extratos'), folder('fo1', 'COMPROVANTES')]);

    await expect(uploadReceipt(file)).resolves.toBe('f1');
    expect(folders.create).not.toHaveBeenCalled();
    expect(folders.upload).toHaveBeenCalledWith('fo1', [file]);
  });

  it('creates the receipts folder when missing', async () => {
    folders.getAll.mockResolvedValue([folder('fo0', 'Extratos')]);
    folders.create.mockResolvedValue(folder('fo2', RECEIPTS_FOLDER));

    await expect(uploadReceipt(file)).resolves.toBe('f1');
    expect(folders.create).toHaveBeenCalledWith('Comprovantes');
    expect(folders.upload).toHaveBeenCalledWith('fo2', [file]);
  });
});

describe('uploadReceipt concurrency', () => {
  it('creates a single receipts folder for uploads that start together', async () => {
    let created!: (value: ReturnType<typeof folder>) => void;
    folders.getAll.mockResolvedValue([folder('fo0', 'Extratos')]);
    folders.create.mockReturnValue(new Promise((resolve) => (created = resolve)));

    const uploads = Promise.all([uploadReceipt(file), uploadReceipt(file), uploadReceipt(file)]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    created(folder('fo2', RECEIPTS_FOLDER));

    await expect(uploads).resolves.toEqual(['f1', 'f1', 'f1']);
    expect(folders.getAll).toHaveBeenCalledTimes(1);
    expect(folders.create).toHaveBeenCalledTimes(1);
    expect(folders.upload).toHaveBeenCalledTimes(3);
  });

  it('looks the folder up again after a failure', async () => {
    folders.getAll.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([folder('fo1', 'Comprovantes')]);

    await expect(uploadReceipt(file)).rejects.toThrow('offline');
    await expect(uploadReceipt(file)).resolves.toBe('f1');
    expect(folders.getAll).toHaveBeenCalledTimes(2);
  });

  it('looks the folder up again for later uploads, in case it was removed', async () => {
    folders.getAll.mockResolvedValue([folder('fo1', 'Comprovantes')]);

    await uploadReceipt(file);
    await uploadReceipt(file);

    expect(folders.getAll).toHaveBeenCalledTimes(2);
  });
});

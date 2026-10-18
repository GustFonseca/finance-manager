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

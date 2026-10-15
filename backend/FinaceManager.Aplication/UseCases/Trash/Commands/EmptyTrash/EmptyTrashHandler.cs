using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;

public class EmptyTrashHandler : IRequestHandler<EmptyTrashCommand, int>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public EmptyTrashHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<int> Handle(EmptyTrashCommand request, CancellationToken cancellationToken = default)
    {
        var folders = await _folderRepository.GetByUserIdAsync(request.UserId, deleted: true);
        var files = new List<StoredFile>(await _fileRepository.GetTrashedAsync(request.UserId));
        foreach (var folder in folders)
            files.AddRange(await _fileRepository.GetByFolderIdAsync(folder.Id));

        await _storage.DeleteAsync(files.Select(f => f.StorageKey).ToList(), cancellationToken);
        await _fileRepository.DeleteRangeAsync(files);
        await _folderRepository.DeleteRangeAsync(folders);
        return files.Count;
    }
}

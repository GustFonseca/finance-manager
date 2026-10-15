using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;

public class DeleteFolderForeverHandler : IRequestHandler<DeleteFolderForeverCommand, bool>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public DeleteFolderForeverHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<bool> Handle(DeleteFolderForeverCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt == null) return false;

        var files = await _fileRepository.GetByFolderIdAsync(folder.Id);
        await _storage.DeleteAsync(files.Select(f => f.StorageKey).ToList(), cancellationToken);
        await _fileRepository.DeleteRangeAsync(files);
        await _folderRepository.DeleteAsync(folder);
        return true;
    }
}

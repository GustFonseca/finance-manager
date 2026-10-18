using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;

public class RestoreFolderHandler : IRequestHandler<RestoreFolderCommand, bool>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public RestoreFolderHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<bool> Handle(RestoreFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt == null) return false;

        var files = (await _fileRepository.GetByFolderIdAsync(folder.Id)).Where(f => f.DeletedAt == folder.DeletedAt).ToList();
        files.ForEach(f => f.DeletedAt = null);
        await _fileRepository.UpdateRangeAsync(files);

        folder.DeletedAt = null;
        await _folderRepository.UpdateAsync(folder);
        return true;
    }
}

using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;

public class RestoreFileHandler : IRequestHandler<RestoreFileCommand, bool>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public RestoreFileHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<bool> Handle(RestoreFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(request.FileId);
        if (file == null || file.UserId != request.UserId || file.DeletedAt == null) return false;

        // A file trashed together with its folder comes back by restoring the folder.
        var folder = await _folderRepository.GetByIdAsync(file.FolderId);
        if (folder == null || folder.DeletedAt != null) return false;

        file.DeletedAt = null;
        await _fileRepository.UpdateAsync(file);
        return true;
    }
}

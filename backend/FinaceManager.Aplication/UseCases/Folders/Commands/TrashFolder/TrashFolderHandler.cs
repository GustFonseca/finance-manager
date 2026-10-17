using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;

public class TrashFolderHandler : IRequestHandler<TrashFolderCommand, bool>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public TrashFolderHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<bool> Handle(TrashFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt != null) return false;
        if (folder.IsSystem)
            throw new InvalidOperationException("A pasta padrão não pode ser excluída.");

        // Files go to the trash with the folder's timestamp, so restoring the
        // folder brings back exactly the files that were in it. Marking the
        // folder first saves everything together, as one history entry.
        var now = DateTime.UtcNow;
        folder.DeletedAt = now;
        var files = (await _fileRepository.GetByFolderIdAsync(folder.Id)).Where(f => f.DeletedAt == null).ToList();
        files.ForEach(f => f.DeletedAt = now);
        await _fileRepository.UpdateRangeAsync(files);
        await _folderRepository.UpdateAsync(folder);
        return true;
    }
}

using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;

public class TrashFolderHandler : IRequestHandler<TrashFolderCommand>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public TrashFolderHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task Handle(TrashFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetLiveAsync(request.FolderId, request.UserId);
        if (folder.IsSystem)
            throw new BusinessRuleException("A pasta padrão não pode ser excluída.");

        var now = DateTime.UtcNow;
        folder.DeletedAt = now;
        var files = (await _fileRepository.GetByFolderIdAsync(folder.Id)).Where(f => f.DeletedAt == null).ToList();
        files.ForEach(f => f.DeletedAt = now);
        await _fileRepository.UpdateRangeAsync(files);
        await _folderRepository.UpdateAsync(folder);
    }
}

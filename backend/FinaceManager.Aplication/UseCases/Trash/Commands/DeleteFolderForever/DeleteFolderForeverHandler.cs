using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;

public class DeleteFolderForeverHandler : IRequestHandler<DeleteFolderForeverCommand>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public DeleteFolderForeverHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task Handle(DeleteFolderForeverCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetTrashedAsync(request.FolderId, request.UserId);

        var files = await _fileRepository.GetByFolderIdAsync(folder.Id);
        files.ForEach(f => f.Purge());
        await _fileRepository.DeleteRangeAsync(files);
        await _folderRepository.DeleteAsync(folder);
    }
}

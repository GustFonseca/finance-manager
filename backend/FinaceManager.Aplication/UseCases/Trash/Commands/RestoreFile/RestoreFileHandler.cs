using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;

public class RestoreFileHandler : IRequestHandler<RestoreFileCommand>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public RestoreFileHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task Handle(RestoreFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetTrashedAsync(request.FileId, request.UserId);

        var folder = await _folderRepository.GetByIdAsync(file.FolderId);
        if (folder == null || folder.DeletedAt != null)
            throw new BusinessRuleException("Restaure a pasta deste arquivo antes.");

        file.DeletedAt = null;
        await _fileRepository.UpdateAsync(file);
    }
}

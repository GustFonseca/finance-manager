using FinanceManager.Domain.Entities;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Folders;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;

public class UpdateFileHandler : IRequestHandler<UpdateFileCommand, StoredFileDto>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public UpdateFileHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<StoredFileDto> Handle(UpdateFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetLiveAsync(request.FileId, request.UserId);

        if (request.FolderId is Guid folderId && folderId != file.FolderId)
        {
            var target = await _folderRepository.FindOwnedAsync(folderId, request.UserId) is { DeletedAt: null } live
                ? live
                : throw new BusinessRuleException("Pasta de destino não encontrada.");
            file.FolderId = target.Id;
        }

        if (request.Name != null)
            file.Name = ItemNames.Validate(request.Name, EntityLimits.FileNameLength);

        await _fileRepository.UpdateAsync(file);
        return file.ToDto();
    }
}

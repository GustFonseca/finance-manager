using FinanceManager.Domain.Entities;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;

public class RenameFolderHandler : IRequestHandler<RenameFolderCommand, FolderDto>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public RenameFolderHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<FolderDto> Handle(RenameFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetLiveAsync(request.FolderId, request.UserId);
        if (folder.IsSystem)
            throw new BusinessRuleException("A pasta padrão não pode ser renomeada.");

        folder.Name = ItemNames.Validate(request.Name, EntityLimits.NameLength);
        await _folderRepository.UpdateAsync(folder);

        var dto = folder.ToDto();
        dto.FileCount = (await _fileRepository.CountActiveByFolderAsync(request.UserId)).GetValueOrDefault(folder.Id);
        return dto;
    }
}

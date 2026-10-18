using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;

public class RenameFolderHandler : IRequestHandler<RenameFolderCommand, FolderDto?>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IMapper _mapper;

    public RenameFolderHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IMapper mapper)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _mapper = mapper;
    }

    public async Task<FolderDto?> Handle(RenameFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt != null) return null;
        if (folder.IsSystem)
            throw new BusinessRuleException("A pasta padrão não pode ser renomeada.");

        folder.Name = ItemNames.Validate(request.Name, 100);
        await _folderRepository.UpdateAsync(folder);

        var dto = _mapper.Map<FolderDto>(folder);
        dto.FileCount = (await _fileRepository.CountActiveByFolderAsync(request.UserId)).GetValueOrDefault(folder.Id);
        return dto;
    }
}

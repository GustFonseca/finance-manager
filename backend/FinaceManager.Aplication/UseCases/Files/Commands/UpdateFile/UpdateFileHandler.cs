using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Folders;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;

public class UpdateFileHandler : IRequestHandler<UpdateFileCommand, StoredFileDto?>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IMapper _mapper;

    public UpdateFileHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IMapper mapper)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _mapper = mapper;
    }

    public async Task<StoredFileDto?> Handle(UpdateFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(request.FileId);
        if (file == null || file.UserId != request.UserId || file.DeletedAt != null) return null;

        if (request.FolderId is Guid folderId && folderId != file.FolderId)
        {
            var target = await _folderRepository.GetByIdAsync(folderId);
            if (target == null || target.UserId != request.UserId || target.DeletedAt != null)
                throw new BusinessRuleException("Pasta de destino não encontrada.");
            file.FolderId = target.Id;
        }

        if (request.Name != null)
            file.Name = ItemNames.Validate(request.Name, 255);

        await _fileRepository.UpdateAsync(file);
        return _mapper.Map<StoredFileDto>(file);
    }
}

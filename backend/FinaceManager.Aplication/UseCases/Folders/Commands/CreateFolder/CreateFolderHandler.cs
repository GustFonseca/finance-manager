using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;

public class CreateFolderHandler : IRequestHandler<CreateFolderCommand, FolderDto>
{
    private readonly IFolderRepository _folderRepository;

    public CreateFolderHandler(IFolderRepository folderRepository)
    {
        _folderRepository = folderRepository;
    }

    public async Task<FolderDto> Handle(CreateFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = new Folder
        {
            UserId = request.UserId,
            Name = ItemNames.Validate(request.Name, EntityLimits.NameLength)
        };

        await _folderRepository.CreateAsync(folder);
        return folder.ToDto();
    }
}

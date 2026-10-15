using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;

public class CreateFolderHandler : IRequestHandler<CreateFolderCommand, FolderDto>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IMapper _mapper;

    public CreateFolderHandler(IFolderRepository folderRepository, IMapper mapper)
    {
        _folderRepository = folderRepository;
        _mapper = mapper;
    }

    public async Task<FolderDto> Handle(CreateFolderCommand request, CancellationToken cancellationToken = default)
    {
        var folder = new Folder
        {
            UserId = request.UserId,
            Name = ItemNames.Validate(request.Name, 100)
        };

        await _folderRepository.CreateAsync(folder);
        return _mapper.Map<FolderDto>(folder);
    }
}

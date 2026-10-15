using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;

public class GetTrashHandler : IRequestHandler<GetTrashQuery, TrashDto>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IMapper _mapper;

    public GetTrashHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IMapper mapper)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _mapper = mapper;
    }

    public async Task<TrashDto> Handle(GetTrashQuery request, CancellationToken cancellationToken = default)
    {
        var trash = new TrashDto();

        foreach (var folder in await _folderRepository.GetByUserIdAsync(request.UserId, deleted: true))
        {
            var dto = _mapper.Map<TrashFolderDto>(folder);
            dto.FileCount = (await _fileRepository.GetByFolderIdAsync(folder.Id)).Count(f => f.DeletedAt == folder.DeletedAt);
            trash.Folders.Add(dto);
        }

        foreach (var file in await _fileRepository.GetTrashedAsync(request.UserId))
        {
            var dto = _mapper.Map<StoredFileDto>(file);
            dto.FolderName = file.Folder.Name;
            trash.Files.Add(dto);
        }

        return trash;
    }
}

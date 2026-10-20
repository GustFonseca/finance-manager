using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Folders.Queries.GetFolders;

public class GetFoldersHandler : IRequestHandler<GetFoldersQuery, List<FolderDto>>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public GetFoldersHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<List<FolderDto>> Handle(GetFoldersQuery request, CancellationToken cancellationToken = default)
    {
        if (await _folderRepository.GetSystemFolderAsync(request.UserId) == null)
        {
            await _folderRepository.CreateAsync(new Folder
            {
                UserId = request.UserId,
                Name = Folder.ImportsFolderName,
                IsSystem = true
            });
        }

        var folders = await _folderRepository.GetByUserIdAsync(request.UserId, deleted: false);
        var counts = await _fileRepository.CountActiveByFolderAsync(request.UserId);

        return folders.Select(f =>
        {
            var dto = f.ToDto();
            dto.FileCount = counts.GetValueOrDefault(f.Id);
            return dto;
        }).ToList();
    }
}

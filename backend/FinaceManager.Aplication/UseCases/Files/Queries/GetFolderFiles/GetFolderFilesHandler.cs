using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;

public class GetFolderFilesHandler : IRequestHandler<GetFolderFilesQuery, List<StoredFileDto>>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public GetFolderFilesHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<List<StoredFileDto>> Handle(GetFolderFilesQuery request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetLiveAsync(request.FolderId, request.UserId);

        var files = await _fileRepository.GetByFolderIdAsync(folder.Id);
        return (files.Where(f => f.DeletedAt == null)).Select(x => x.ToDto()).ToList();
    }
}

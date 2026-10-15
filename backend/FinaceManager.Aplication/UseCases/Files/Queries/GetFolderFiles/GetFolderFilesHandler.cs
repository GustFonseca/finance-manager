using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;

public class GetFolderFilesHandler : IRequestHandler<GetFolderFilesQuery, List<StoredFileDto>?>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IMapper _mapper;

    public GetFolderFilesHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IMapper mapper)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _mapper = mapper;
    }

    public async Task<List<StoredFileDto>?> Handle(GetFolderFilesQuery request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt != null) return null;

        var files = await _fileRepository.GetByFolderIdAsync(folder.Id);
        return _mapper.Map<List<StoredFileDto>>(files.Where(f => f.DeletedAt == null));
    }
}

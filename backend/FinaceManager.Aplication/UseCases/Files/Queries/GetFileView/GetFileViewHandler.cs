using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFileView;

public class GetFileViewHandler : IRequestHandler<GetFileViewQuery, FileViewDto>
{
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public GetFileViewHandler(IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<FileViewDto> Handle(GetFileViewQuery request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetLiveAsync(request.FileId, request.UserId);

        return new FileViewDto
        {
            Url = await _storage.GetDownloadUrlAsync(file.StorageKey, null, cancellationToken),
            Name = file.Name,
            ContentType = file.ContentType,
            SizeBytes = file.SizeBytes,
        };
    }
}

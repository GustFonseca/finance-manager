using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFileView;

public class GetFileViewHandler : IRequestHandler<GetFileViewQuery, FileViewDto?>
{
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public GetFileViewHandler(IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<FileViewDto?> Handle(GetFileViewQuery request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(request.FileId);
        if (file == null || file.UserId != request.UserId || file.DeletedAt != null) return null;

        return new FileViewDto
        {
            Url = await _storage.GetDownloadUrlAsync(file.StorageKey, null, cancellationToken),
            Name = file.Name,
            ContentType = file.ContentType,
            SizeBytes = file.SizeBytes,
        };
    }
}

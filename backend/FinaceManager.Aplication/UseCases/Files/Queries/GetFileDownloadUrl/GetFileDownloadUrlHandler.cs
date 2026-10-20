using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;

public class GetFileDownloadUrlHandler : IRequestHandler<GetFileDownloadUrlQuery, string>
{
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public GetFileDownloadUrlHandler(IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<string> Handle(GetFileDownloadUrlQuery request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetLiveAsync(request.FileId, request.UserId);

        return await _storage.GetDownloadUrlAsync(file.StorageKey, file.Name, cancellationToken);
    }
}

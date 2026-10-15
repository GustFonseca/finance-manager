using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;

public class DeleteFileForeverHandler : IRequestHandler<DeleteFileForeverCommand, bool>
{
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public DeleteFileForeverHandler(IStoredFileRepository fileRepository, IFileStorage storage)
    {
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<bool> Handle(DeleteFileForeverCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(request.FileId);
        if (file == null || file.UserId != request.UserId || file.DeletedAt == null) return false;

        await _storage.DeleteAsync([file.StorageKey], cancellationToken);
        await _fileRepository.DeleteAsync(file);
        return true;
    }
}

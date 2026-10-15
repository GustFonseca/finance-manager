using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;

public class TrashFileHandler : IRequestHandler<TrashFileCommand, bool>
{
    private readonly IStoredFileRepository _fileRepository;

    public TrashFileHandler(IStoredFileRepository fileRepository)
    {
        _fileRepository = fileRepository;
    }

    public async Task<bool> Handle(TrashFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetByIdAsync(request.FileId);
        if (file == null || file.UserId != request.UserId || file.DeletedAt != null) return false;

        file.DeletedAt = DateTime.UtcNow;
        await _fileRepository.UpdateAsync(file);
        return true;
    }
}

using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;

public class TrashFileHandler : IRequestHandler<TrashFileCommand>
{
    private readonly IStoredFileRepository _fileRepository;

    public TrashFileHandler(IStoredFileRepository fileRepository)
    {
        _fileRepository = fileRepository;
    }

    public async Task Handle(TrashFileCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetLiveAsync(request.FileId, request.UserId);

        file.DeletedAt = DateTime.UtcNow;
        await _fileRepository.UpdateAsync(file);
    }
}

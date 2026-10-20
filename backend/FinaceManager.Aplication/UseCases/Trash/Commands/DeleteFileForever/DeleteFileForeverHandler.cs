using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;

public class DeleteFileForeverHandler : IRequestHandler<DeleteFileForeverCommand>
{
    private readonly IStoredFileRepository _fileRepository;

    public DeleteFileForeverHandler(IStoredFileRepository fileRepository)
    {
        _fileRepository = fileRepository;
    }

    public async Task Handle(DeleteFileForeverCommand request, CancellationToken cancellationToken = default)
    {
        var file = await _fileRepository.GetTrashedAsync(request.FileId, request.UserId);

        file.Purge();
        await _fileRepository.DeleteAsync(file);
    }
}

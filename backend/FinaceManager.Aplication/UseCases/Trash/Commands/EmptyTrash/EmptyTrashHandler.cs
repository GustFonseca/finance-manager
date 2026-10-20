using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;

public class EmptyTrashHandler : IRequestHandler<EmptyTrashCommand, int>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;

    public EmptyTrashHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
    }

    public async Task<int> Handle(EmptyTrashCommand request, CancellationToken cancellationToken = default)
    {
        var folders = await _folderRepository.GetByUserIdAsync(request.UserId, deleted: true);
        var files = new List<StoredFile>(await _fileRepository.GetTrashedAsync(request.UserId));
        files.AddRange(await _fileRepository.GetByFolderIdsAsync(folders.Select(f => f.Id).ToList()));

        files.ForEach(f => f.Purge());
        await _fileRepository.DeleteRangeAsync(files);
        await _folderRepository.DeleteRangeAsync(folders);
        return files.Count;
    }
}

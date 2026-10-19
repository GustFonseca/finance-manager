using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;

public class EmptyTrashHandler : IRequestHandler<EmptyTrashCommand, int>
{
    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;
    private readonly IUnitOfWork _unitOfWork;

    public EmptyTrashHandler(IFolderRepository folderRepository, IStoredFileRepository fileRepository, IFileStorage storage, IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<int> Handle(EmptyTrashCommand request, CancellationToken cancellationToken = default)
    {
        var folders = await _folderRepository.GetByUserIdAsync(request.UserId, deleted: true);
        var files = new List<StoredFile>(await _fileRepository.GetTrashedAsync(request.UserId));
        files.AddRange(await _fileRepository.GetByFolderIdsAsync(folders.Select(f => f.Id).ToList()));

        await _fileRepository.DeleteRangeAsync(files);
        await _folderRepository.DeleteRangeAsync(folders);
        StorageCleanup.AfterCommit(_unitOfWork, _storage, files.Select(f => f.StorageKey).ToList());
        return files.Count;
    }
}

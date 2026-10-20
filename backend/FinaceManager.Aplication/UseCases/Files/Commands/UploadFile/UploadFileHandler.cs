using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Aplication.UseCases.Folders;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;

public class UploadFileHandler : IRequestHandler<UploadFileCommand, StoredFileDto>
{
    public const long MaxSizeBytes = 20 * 1024 * 1024;

    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;

    public UploadFileHandler(
        IFolderRepository folderRepository,
        IStoredFileRepository fileRepository,
        IFileStorage storage)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _storage = storage;
    }

    public async Task<StoredFileDto> Handle(UploadFileCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetLiveAsync(request.FolderId, request.UserId);

        var name = ItemNames.Validate(Path.GetFileName(request.FileName), EntityLimits.FileNameLength);
        if (request.SizeBytes > MaxSizeBytes)
            throw new BusinessRuleException($"\"{name}\" passa do limite de {MaxSizeBytes / 1024 / 1024} MB.");

        var file = new StoredFile
        {
            UserId = request.UserId,
            FolderId = folder.Id,
            Name = name,
            ContentType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType,
            SizeBytes = request.SizeBytes,
        };
        file.StorageKey = $"{request.UserId}/{file.Id}";

        await _storage.UploadAsync(file.StorageKey, request.Content, file.ContentType, cancellationToken);
        try
        {
            await _fileRepository.CreateAsync(file);
        }
        catch
        {
            await _storage.DeleteAsync([file.StorageKey], CancellationToken.None);
            throw;
        }

        return file.ToDto();
    }
}

using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Aplication.UseCases.Folders;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;

public class UploadFileHandler : IRequestHandler<UploadFileCommand, StoredFileDto?>
{
    /// <summary>Largest file accepted (Supabase's free plan allows up to 50 MB).</summary>
    public const long MaxSizeBytes = 20 * 1024 * 1024;

    private readonly IFolderRepository _folderRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IFileStorage _storage;
    private readonly IMapper _mapper;

    public UploadFileHandler(
        IFolderRepository folderRepository,
        IStoredFileRepository fileRepository,
        IFileStorage storage,
        IMapper mapper)
    {
        _folderRepository = folderRepository;
        _fileRepository = fileRepository;
        _storage = storage;
        _mapper = mapper;
    }

    public async Task<StoredFileDto?> Handle(UploadFileCommand request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepository.GetByIdAsync(request.FolderId);
        if (folder == null || folder.UserId != request.UserId || folder.DeletedAt != null) return null;

        var name = ItemNames.Validate(Path.GetFileName(request.FileName), 255);
        if (request.SizeBytes > MaxSizeBytes)
            throw new InvalidOperationException($"\"{name}\" passa do limite de {MaxSizeBytes / 1024 / 1024} MB.");

        var file = new StoredFile
        {
            UserId = request.UserId,
            FolderId = folder.Id,
            Name = name,
            ContentType = string.IsNullOrWhiteSpace(request.ContentType) ? "application/octet-stream" : request.ContentType,
            SizeBytes = request.SizeBytes,
        };
        // The key never changes, so renaming or moving the file is metadata-only.
        file.StorageKey = $"{request.UserId}/{file.Id}";

        await _storage.UploadAsync(file.StorageKey, request.Content, file.ContentType, cancellationToken);
        try
        {
            await _fileRepository.CreateAsync(file);
        }
        catch
        {
            await _storage.DeleteAsync([file.StorageKey], cancellationToken);
            throw;
        }

        return _mapper.Map<StoredFileDto>(file);
    }
}

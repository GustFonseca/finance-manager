using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;

/// <summary>Stores one uploaded file in a folder; null when the folder isn't the user's.</summary>
public record UploadFileCommand(
    Guid UserId,
    Guid FolderId,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content
) : ICommand<StoredFileDto?>;

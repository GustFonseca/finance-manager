using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;

public record UploadFileCommand(
    Guid UserId,
    Guid FolderId,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content
) : ICommand<StoredFileDto?>, IRunsOutsideTransaction;

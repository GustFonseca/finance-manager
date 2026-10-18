using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;

public record UpdateFileCommand(Guid UserId, Guid FileId, string? Name, Guid? FolderId) : ICommand<StoredFileDto?>;

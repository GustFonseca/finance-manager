using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;

/// <summary>Renames and/or moves a file to another folder; null fields stay as they are.</summary>
public record UpdateFileCommand(Guid UserId, Guid FileId, string? Name, Guid? FolderId) : ICommand<StoredFileDto?>;

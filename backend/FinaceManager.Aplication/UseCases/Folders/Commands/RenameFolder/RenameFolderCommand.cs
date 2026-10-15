using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;

public record RenameFolderCommand(Guid UserId, Guid FolderId, string Name) : ICommand<FolderDto?>;

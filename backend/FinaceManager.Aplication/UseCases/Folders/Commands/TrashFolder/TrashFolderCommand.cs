using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;

public record TrashFolderCommand(Guid UserId, Guid FolderId) : ICommand<bool>;

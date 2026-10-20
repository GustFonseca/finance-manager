using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;

public record RestoreFolderCommand(Guid UserId, Guid FolderId) : ICommand;

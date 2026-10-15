using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;

public record DeleteFolderForeverCommand(Guid UserId, Guid FolderId) : ICommand<bool>;

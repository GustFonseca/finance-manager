using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;

public record EmptyTrashCommand(Guid UserId) : ICommand<int>;

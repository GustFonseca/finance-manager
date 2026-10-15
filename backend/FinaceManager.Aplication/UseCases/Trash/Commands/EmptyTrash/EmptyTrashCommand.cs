using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;

/// <summary>Permanently deletes everything in the trash; returns how many files were removed.</summary>
public record EmptyTrashCommand(Guid UserId) : ICommand<int>;

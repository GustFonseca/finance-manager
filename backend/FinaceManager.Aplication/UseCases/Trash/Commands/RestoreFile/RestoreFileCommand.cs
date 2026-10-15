using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;

public record RestoreFileCommand(Guid UserId, Guid FileId) : ICommand<bool>;

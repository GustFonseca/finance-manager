using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;

public record DeleteFileForeverCommand(Guid UserId, Guid FileId) : ICommand;

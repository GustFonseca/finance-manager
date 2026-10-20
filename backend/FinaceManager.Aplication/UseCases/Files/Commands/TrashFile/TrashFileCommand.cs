using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;

public record TrashFileCommand(Guid UserId, Guid FileId) : ICommand;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;

public record CreateFolderCommand(Guid UserId, string Name) : ICommand<FolderDto>;

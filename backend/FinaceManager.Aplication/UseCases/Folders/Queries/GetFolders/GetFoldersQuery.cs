using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Folders.Queries.GetFolders;

public record GetFoldersQuery(Guid UserId) : IQuery<List<FolderDto>>;

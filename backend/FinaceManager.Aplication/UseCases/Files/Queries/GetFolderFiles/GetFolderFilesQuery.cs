using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;

public record GetFolderFilesQuery(Guid UserId, Guid FolderId) : IQuery<List<StoredFileDto>?>;

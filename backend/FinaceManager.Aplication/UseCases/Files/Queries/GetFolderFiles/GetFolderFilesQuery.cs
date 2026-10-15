using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;

/// <summary>Files of a folder outside the trash; null when the folder isn't the user's.</summary>
public record GetFolderFilesQuery(Guid UserId, Guid FolderId) : IQuery<List<StoredFileDto>?>;

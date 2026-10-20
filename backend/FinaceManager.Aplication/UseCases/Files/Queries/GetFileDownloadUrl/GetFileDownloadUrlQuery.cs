using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;

public record GetFileDownloadUrlQuery(Guid UserId, Guid FileId) : IQuery<string>;

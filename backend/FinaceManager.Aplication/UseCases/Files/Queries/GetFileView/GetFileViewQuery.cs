using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Files.Queries.GetFileView;

public record GetFileViewQuery(Guid UserId, Guid FileId) : IQuery<FileViewDto>;

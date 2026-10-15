using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;

public record GetTrashQuery(Guid UserId) : IQuery<TrashDto>;

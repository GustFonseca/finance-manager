using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;

public record GetActivityQuery(Guid UserId, DateTime? Before, int Limit) : IQuery<List<ActivityLogDto>>;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;

/// <summary>The user's history, newest first; <paramref name="Before"/> loads older pages.</summary>
public record GetActivityQuery(Guid UserId, DateTime? Before, int Limit) : IQuery<List<ActivityLogDto>>;

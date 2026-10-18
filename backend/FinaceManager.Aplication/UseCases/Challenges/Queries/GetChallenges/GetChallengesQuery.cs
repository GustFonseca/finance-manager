using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Challenges.Queries.GetChallenges;

public record GetChallengesQuery(Guid UserId, DateTime Now) : IQuery<List<ChallengeDto>>;

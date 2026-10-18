using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Challenges.Commands.CreateChallenge;

public record CreateChallengeCommand(
    Guid UserId, string Name, ChallengeScope Scope, Guid? TargetId, long LimitCents, DateTime StartsOn, int Days, DateTime Now)
    : ICommand<ChallengeDto>;

using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;

public record DeleteChallengeCommand(Guid UserId, Guid ChallengeId) : ICommand<bool>;

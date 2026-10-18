using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;

public class DeleteChallengeHandler : IRequestHandler<DeleteChallengeCommand, bool>
{
    private readonly IChallengeRepository _challengeRepository;

    public DeleteChallengeHandler(IChallengeRepository challengeRepository)
    {
        _challengeRepository = challengeRepository;
    }

    public async Task<bool> Handle(DeleteChallengeCommand request, CancellationToken cancellationToken = default)
    {
        var challenge = await _challengeRepository.GetByIdAsync(request.ChallengeId);
        if (challenge == null || challenge.UserId != request.UserId) return false;

        await _challengeRepository.DeleteAsync(challenge);
        return true;
    }
}

using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;

public class DeleteChallengeHandler : IRequestHandler<DeleteChallengeCommand>
{
    private readonly IChallengeRepository _challengeRepository;

    public DeleteChallengeHandler(IChallengeRepository challengeRepository)
    {
        _challengeRepository = challengeRepository;
    }

    public async Task Handle(DeleteChallengeCommand request, CancellationToken cancellationToken = default)
    {
        var challenge = await _challengeRepository.GetOwnedAsync(request.ChallengeId, request.UserId);

        await _challengeRepository.DeleteAsync(challenge);
    }
}

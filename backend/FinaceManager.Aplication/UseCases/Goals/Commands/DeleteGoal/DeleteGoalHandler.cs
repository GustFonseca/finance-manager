using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;

public class DeleteGoalHandler : IRequestHandler<DeleteGoalCommand>
{
    private readonly IGoalRepository _goalRepository;

    public DeleteGoalHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task Handle(DeleteGoalCommand request, CancellationToken cancellationToken = default)
    {
        var goal = await _goalRepository.GetOwnedAsync(request.GoalId, request.UserId);

        await _goalRepository.DeleteAsync(goal);
    }
}

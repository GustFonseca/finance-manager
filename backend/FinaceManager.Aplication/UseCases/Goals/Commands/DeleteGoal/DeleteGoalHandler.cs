using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;

public class DeleteGoalHandler : IRequestHandler<DeleteGoalCommand, bool>
{
    private readonly IGoalRepository _goalRepository;

    public DeleteGoalHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<bool> Handle(DeleteGoalCommand request, CancellationToken cancellationToken = default)
    {
        var goal = await _goalRepository.GetByIdAsync(request.GoalId);
        if (goal == null || goal.UserId != request.UserId) return false;

        await _goalRepository.DeleteAsync(goal);
        return true;
    }
}

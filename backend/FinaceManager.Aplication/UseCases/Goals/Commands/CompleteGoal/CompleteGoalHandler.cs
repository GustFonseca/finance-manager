using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;

public class CompleteGoalHandler : IRequestHandler<CompleteGoalCommand, GoalDto>
{
    private readonly IGoalRepository _goalRepository;

    public CompleteGoalHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<GoalDto> Handle(CompleteGoalCommand request, CancellationToken cancellationToken = default)
    {
        var goal = await _goalRepository.GetOwnedAsync(request.GoalId, request.UserId);

        goal.Complete();
        await _goalRepository.UpdateAsync(goal);

        return goal.ToDto();
    }
}

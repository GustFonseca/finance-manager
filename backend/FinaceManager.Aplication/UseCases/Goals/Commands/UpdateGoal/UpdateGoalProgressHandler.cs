using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;

public class UpdateGoalProgressHandler : IRequestHandler<UpdateGoalProgressCommand, GoalDto>
{
    private readonly IGoalRepository _goalRepository;

    public UpdateGoalProgressHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<GoalDto> Handle(UpdateGoalProgressCommand request, CancellationToken cancellationToken = default)
    {
        Input.Positive(request.AmountCents, "O valor deve ser maior que zero.");
        var goal = await _goalRepository.GetOwnedAsync(request.GoalId, request.UserId);

        goal.AddProgress(request.AmountCents);
        await _goalRepository.UpdateAsync(goal);

        return goal.ToDto();
    }
}

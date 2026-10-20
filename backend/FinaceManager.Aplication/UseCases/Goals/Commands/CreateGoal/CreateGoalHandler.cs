using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;

public class CreateGoalHandler : IRequestHandler<CreateGoalCommand, GoalDto>
{
    private readonly IGoalRepository _goalRepository;

    public CreateGoalHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<GoalDto> Handle(CreateGoalCommand request, CancellationToken cancellationToken = default)
    {
        Input.Positive(request.TargetCents, "O valor da meta deve ser maior que zero.");
        var goal = new Goal
        {
            UserId = request.UserId,
            Name = Input.Name(request.Name),
            TargetCents = request.TargetCents,
            Deadline = request.Deadline,
            Status = GoalStatus.ACTIVE
        };

        await _goalRepository.CreateAsync(goal);
        var dto = goal.ToDto();
        dto.ProgressPercent = 0;
        return dto;
    }
}

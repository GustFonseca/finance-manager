using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;

public class CompleteGoalHandler : IRequestHandler<CompleteGoalCommand, GoalDto>
{
    private readonly IGoalRepository _goalRepository;
    private readonly IMapper _mapper;

    public CompleteGoalHandler(IGoalRepository goalRepository, IMapper mapper)
    {
        _goalRepository = goalRepository;
        _mapper = mapper;
    }

    public async Task<GoalDto> Handle(CompleteGoalCommand request, CancellationToken cancellationToken = default)
    {
        var goal = await _goalRepository.GetByIdAsync(request.GoalId)
            ?? throw new InvalidOperationException("Goal not found");
        if (goal.UserId != request.UserId)
            throw new InvalidOperationException("Goal not found");

        goal.Status = GoalStatus.COMPLETED;
        await _goalRepository.UpdateAsync(goal);

        var dto = _mapper.Map<GoalDto>(goal);
        dto.ProgressPercent = goal.TargetCents > 0 ? Math.Round((double)goal.CurrentCents / goal.TargetCents * 100, 1) : 0;
        return dto;
    }
}

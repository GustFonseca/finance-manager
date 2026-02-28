using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;

public class CreateGoalHandler : IRequestHandler<CreateGoalCommand, GoalDto>
{
    private readonly IGoalRepository _goalRepository;
    private readonly IMapper _mapper;

    public CreateGoalHandler(IGoalRepository goalRepository, IMapper mapper)
    {
        _goalRepository = goalRepository;
        _mapper = mapper;
    }

    public async Task<GoalDto> Handle(CreateGoalCommand request, CancellationToken cancellationToken = default)
    {
        var goal = new Goal
        {
            UserId = request.UserId,
            Name = request.Name,
            TargetCents = request.TargetCents,
            Deadline = request.Deadline,
            Status = GoalStatus.ACTIVE
        };

        await _goalRepository.CreateAsync(goal);
        var dto = _mapper.Map<GoalDto>(goal);
        dto.ProgressPercent = 0;
        return dto;
    }
}

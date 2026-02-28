using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;

public class GetAllGoalsHandler : IRequestHandler<GetAllGoalsQuery, List<GoalDto>>
{
    private readonly IGoalRepository _goalRepository;
    private readonly IMapper _mapper;

    public GetAllGoalsHandler(IGoalRepository goalRepository, IMapper mapper)
    {
        _goalRepository = goalRepository;
        _mapper = mapper;
    }

    public async Task<List<GoalDto>> Handle(GetAllGoalsQuery request, CancellationToken cancellationToken = default)
    {
        var goals = await _goalRepository.GetByUserIdAsync(request.UserId);

        return goals.Select(g =>
        {
            var dto = _mapper.Map<GoalDto>(g);
            dto.ProgressPercent = g.TargetCents > 0 ? Math.Round((double)g.CurrentCents / g.TargetCents * 100, 1) : 0;
            return dto;
        }).ToList();
    }
}

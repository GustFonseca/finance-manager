using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;

public class GetAllGoalsHandler : IRequestHandler<GetAllGoalsQuery, List<GoalDto>>
{
    private readonly IGoalRepository _goalRepository;

    public GetAllGoalsHandler(IGoalRepository goalRepository)
    {
        _goalRepository = goalRepository;
    }

    public async Task<List<GoalDto>> Handle(GetAllGoalsQuery request, CancellationToken cancellationToken = default)
    {
        var goals = await _goalRepository.GetByUserIdAsync(request.UserId);

        return goals.Select(x => x.ToDto()).ToList();
    }
}

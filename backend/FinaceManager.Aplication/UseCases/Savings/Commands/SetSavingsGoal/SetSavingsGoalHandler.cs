using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;

public class SetSavingsGoalHandler : IRequestHandler<SetSavingsGoalCommand, long>
{
    private readonly ISavingsPlanRepository _planRepository;

    public SetSavingsGoalHandler(ISavingsPlanRepository planRepository)
    {
        _planRepository = planRepository;
    }

    public async Task<long> Handle(SetSavingsGoalCommand request, CancellationToken cancellationToken = default)
    {
        if (request.MonthlyGoalCents < 0)
            throw new InvalidOperationException("A meta não pode ser negativa.");

        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        if (plan == null)
        {
            await _planRepository.CreateAsync(new SavingsPlan
            {
                UserId = request.UserId,
                MonthlyGoalCents = request.MonthlyGoalCents
            });
        }
        else
        {
            plan.MonthlyGoalCents = request.MonthlyGoalCents;
            plan.UpdatedAt = DateTime.UtcNow;
            await _planRepository.UpdateAsync(plan);
        }
        return request.MonthlyGoalCents;
    }
}

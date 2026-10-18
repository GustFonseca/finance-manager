using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Planning.Commands.SetEmergencyFund;

public class SetEmergencyFundHandler : IRequestHandler<SetEmergencyFundCommand, bool>
{
    private readonly ISavingsPlanRepository _planRepository;
    private readonly IGoalRepository _goalRepository;

    public SetEmergencyFundHandler(ISavingsPlanRepository planRepository, IGoalRepository goalRepository)
    {
        _planRepository = planRepository;
        _goalRepository = goalRepository;
    }

    public async Task<bool> Handle(SetEmergencyFundCommand request, CancellationToken cancellationToken = default)
    {
        if (request.Months < 1 || request.Months > PlanningAnalyzer.MaxEmergencyMonths)
            throw new BusinessRuleException($"A reserva deve cobrir de 1 a {PlanningAnalyzer.MaxEmergencyMonths} meses.");
        if (request.GoalId is { } goalId && !(await _goalRepository.GetByUserIdAsync(request.UserId)).Any(g => g.Id == goalId))
            throw new BusinessRuleException("Escolha uma das suas metas.");

        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        if (plan == null)
        {
            await _planRepository.CreateAsync(new SavingsPlan { UserId = request.UserId, EmergencyMonths = request.Months, EmergencyGoalId = request.GoalId });
            return true;
        }
        plan.EmergencyMonths = request.Months;
        plan.EmergencyGoalId = request.GoalId;
        plan.UpdatedAt = DateTime.UtcNow;
        await _planRepository.UpdateAsync(plan);
        return true;
    }
}

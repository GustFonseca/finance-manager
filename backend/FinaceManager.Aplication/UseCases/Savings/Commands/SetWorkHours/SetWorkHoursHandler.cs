using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetWorkHours;

public class SetWorkHoursHandler : IRequestHandler<SetWorkHoursCommand, int>
{
    private readonly ISavingsPlanRepository _planRepository;

    public SetWorkHoursHandler(ISavingsPlanRepository planRepository)
    {
        _planRepository = planRepository;
    }

    public async Task<int> Handle(SetWorkHoursCommand request, CancellationToken cancellationToken = default)
    {
        if (request.Hours < 1 || request.Hours > WorkValue.MaxHoursPerMonth)
            throw new BusinessRuleException($"As horas trabalhadas devem ficar entre 1 e {WorkValue.MaxHoursPerMonth} por mês.");

        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        if (plan == null)
        {
            await _planRepository.CreateAsync(new SavingsPlan { UserId = request.UserId, WorkHoursPerMonth = request.Hours });
        }
        else
        {
            plan.WorkHoursPerMonth = request.Hours;
            plan.UpdatedAt = DateTime.UtcNow;
            await _planRepository.UpdateAsync(plan);
        }
        return request.Hours;
    }
}

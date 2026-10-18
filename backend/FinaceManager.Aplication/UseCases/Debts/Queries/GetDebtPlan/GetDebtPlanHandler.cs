using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Debts.Queries.GetDebtPlan;

public class GetDebtPlanHandler : IRequestHandler<GetDebtPlanQuery, DebtPlanDto>
{
    private readonly IDebtRepository _debtRepository;

    public GetDebtPlanHandler(IDebtRepository debtRepository)
    {
        _debtRepository = debtRepository;
    }

    public async Task<DebtPlanDto> Handle(GetDebtPlanQuery request, CancellationToken cancellationToken = default) =>
        DebtPlanner.Plan(await _debtRepository.GetByUserIdAsync(request.UserId), request.ExtraCents);
}

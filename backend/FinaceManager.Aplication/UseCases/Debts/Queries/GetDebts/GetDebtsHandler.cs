using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Debts.Queries.GetDebts;

public class GetDebtsHandler : IRequestHandler<GetDebtsQuery, List<DebtDto>>
{
    private readonly IDebtRepository _debtRepository;

    public GetDebtsHandler(IDebtRepository debtRepository)
    {
        _debtRepository = debtRepository;
    }

    public async Task<List<DebtDto>> Handle(GetDebtsQuery request, CancellationToken cancellationToken = default) =>
        (await _debtRepository.GetByUserIdAsync(request.UserId)).Select(DebtMapper.ToDto).ToList();
}

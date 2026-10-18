using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetNetWorth;

public class GetNetWorthHandler : IRequestHandler<GetNetWorthQuery, NetWorthDto>
{
    private readonly IAccountRepository _accountRepository;
    private readonly IDebtRepository _debtRepository;
    private readonly ITransactionRepository _transactionRepository;

    public GetNetWorthHandler(IAccountRepository accountRepository, IDebtRepository debtRepository, ITransactionRepository transactionRepository)
    {
        _accountRepository = accountRepository;
        _debtRepository = debtRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<NetWorthDto> Handle(GetNetWorthQuery request, CancellationToken cancellationToken = default)
    {
        var accounts = await _accountRepository.GetByUserIdAsync(request.UserId);
        var debts = await _debtRepository.GetByUserIdAsync(request.UserId);
        var oldest = request.MonthStart.AddMonths(1 - PlanningAnalyzer.NetWorthMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, oldest, null);
        return PlanningAnalyzer.NetWorth(accounts, debts, transactions, request.MonthStart);
    }
}

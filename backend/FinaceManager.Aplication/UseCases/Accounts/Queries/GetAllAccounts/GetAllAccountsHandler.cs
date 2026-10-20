using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;

public class GetAllAccountsHandler : IRequestHandler<GetAllAccountsQuery, List<AccountDto>>
{
    private readonly IAccountRepository _accountRepository;

    public GetAllAccountsHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }
    public async Task<List<AccountDto>> Handle(GetAllAccountsQuery request, CancellationToken cancellationToken = default)
    {
        var accounts = await _accountRepository.GetByUserIdAsync(request.userId);
        return accounts.Select(x => x.ToDto()).ToList();
    }
}

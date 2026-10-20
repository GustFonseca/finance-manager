using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;

public class UpdateAccountHandler : IRequestHandler<UpdateAccountCommand, AccountDto>
{
    private readonly IAccountRepository _accountRepository;

    public UpdateAccountHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }
    public async Task<AccountDto> Handle(UpdateAccountCommand request, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepository.GetOwnedAsync(request.AccountId, request.UserId);

        account.UpdateName(Input.Name(request.Name));

        await _accountRepository.UpdateAsync(account);

        return account.ToDto();
    }
}


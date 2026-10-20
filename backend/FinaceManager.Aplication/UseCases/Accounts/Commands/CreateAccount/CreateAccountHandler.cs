using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Validation;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;

public class CreateAccountHandler : IRequestHandler<CreateAccountCommand, AccountDto>
{
    private readonly IAccountRepository _accountRepository;
    public CreateAccountHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }
    public async Task<AccountDto> Handle(CreateAccountCommand request, CancellationToken cancellationToken = default)
    {
        var account = new Account(request.userId, Input.Name(request.name));

        await _accountRepository.CreateAsync(account);

        return account.ToDto();
    }
}


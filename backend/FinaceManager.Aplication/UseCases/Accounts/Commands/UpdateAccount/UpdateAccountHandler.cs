using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;

public class UpdateAccountHandler : IRequestHandler<UpdateAccountCommand, AccountDto?>
{
    private readonly IAccountRepository _accountRepository;
    private readonly IMapper _mapper;

    public UpdateAccountHandler(IAccountRepository accountRepository, IMapper mapper)
    {
        _accountRepository = accountRepository;
        _mapper = mapper;
    }
    public async Task<AccountDto?> Handle(UpdateAccountCommand request, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepository.GetByIdAsync(request.accountId);

        if (account == null) 
        {
            return null;
        }

        account.UpdateName(request.newName);

        await _accountRepository.UpdateAsync(account);

        return _mapper.Map<AccountDto>(account);
    }
}



using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;

public class CreateAccountHandler : IRequestHandler<CreateAccountCommand, AccountDto>
{
    private readonly IAccountRepository _accountRepository;
    private readonly IMapper _mapper;
    public CreateAccountHandler(IAccountRepository accountRepository, IMapper mapper)
    {
        _accountRepository = accountRepository;
        _mapper = mapper;
    }
    public async Task<AccountDto> Handle(CreateAccountCommand request, CancellationToken cancellationToken = default)
    {
        var account = new Account(request.userId, request.name);

        await _accountRepository.CreateAsync(account);

        return _mapper.Map<AccountDto>(account);
    }
}


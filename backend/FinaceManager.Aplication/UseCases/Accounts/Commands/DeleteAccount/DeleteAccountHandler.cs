using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.DeleteAccount;

public class DeleteAccountHandler : IRequestHandler<DeleteAccountCommand, bool>
{
    private readonly IAccountRepository _accountRepository;
    private readonly ITransactionRepository _transactionRepository;

    public DeleteAccountHandler(IAccountRepository accountRepository, ITransactionRepository transactionRepository)
    {
        _accountRepository = accountRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<bool> Handle(DeleteAccountCommand request, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepository.GetByIdAsync(request.AccountId);
        if (account == null || account.UserId != request.UserId) return false;

        if (await _transactionRepository.ExistsForAccountAsync(request.AccountId))
            throw new BusinessRuleException("Não é possível excluir uma conta que tem transações. Apague as transações dela antes.");

        await _accountRepository.DeleteAsync(account);
        return true;
    }
}

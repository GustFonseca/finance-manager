using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;

public class DeleteAllTransactionsHandler : IRequestHandler<DeleteAllTransactionsCommand, int>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;

    public DeleteAllTransactionsHandler(ITransactionRepository transactionRepository, IAccountRepository accountRepository)
    {
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
    }

    public async Task<int> Handle(DeleteAllTransactionsCommand request, CancellationToken cancellationToken = default)
    {
        var deleted = await _transactionRepository.DeleteByUserIdAsync(request.UserId);

        foreach (var account in await _accountRepository.GetByUserIdAsync(request.UserId))
        {
            if (account.BalanceCents == 0) continue;
            account.ResetBalance();
            await _accountRepository.UpdateAsync(account);
        }

        return deleted;
    }
}

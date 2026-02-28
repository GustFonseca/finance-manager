using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;

public class DeleteTransactionHandler : IRequestHandler<DeleteTransactionCommand>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;

    public DeleteTransactionHandler(ITransactionRepository transactionRepository, IAccountRepository accountRepository)
    {
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
    }

    public async Task Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        var transaction = await _transactionRepository.GetByIdAsync(request.TransactionId)
            ?? throw new InvalidOperationException("Transaction not found");
        if (transaction.UserId != request.UserId)
            throw new InvalidOperationException("Transaction not found");

        var account = await _accountRepository.GetByIdAsync(transaction.AccountId)
            ?? throw new InvalidOperationException("Account not found");

        // Revert balance
        if (transaction.Type == TransactionType.INCOME)
            account.SubtractBalance(transaction.AmountCents);
        else
            account.AddBalance(transaction.AmountCents);

        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.DeleteAsync(transaction);
    }
}

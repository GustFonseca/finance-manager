using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
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
        var transaction = await _transactionRepository.GetOwnedAsync(request.TransactionId, request.UserId);

        var account = await _accountRepository.GetByIdAsync(transaction.AccountId)
            ?? throw new NotFoundException("Conta não encontrada.");

        account.Reverse(transaction);

        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.DeleteAsync(transaction);
    }
}

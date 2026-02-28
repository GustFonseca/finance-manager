using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;

public class CreateTransactionHandler : IRequestHandler<CreateTransactionCommand, TransactionDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMapper _mapper;

    public CreateTransactionHandler(
        ITransactionRepository transactionRepository,
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        IMapper mapper)
    {
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
        _categoryRepository = categoryRepository;
        _mapper = mapper;
    }

    public async Task<TransactionDto> Handle(CreateTransactionCommand request, CancellationToken cancellationToken = default)
    {
        var account = await _accountRepository.GetByIdAsync(request.AccountId)
            ?? throw new InvalidOperationException("Account not found");
        if (account.UserId != request.UserId)
            throw new InvalidOperationException("Account not found");

        var category = await _categoryRepository.GetByIdAsync(request.CategoryId)
            ?? throw new InvalidOperationException("Category not found");
        if (category.UserId != request.UserId)
            throw new InvalidOperationException("Category not found");

        var transaction = new Transaction
        {
            UserId = request.UserId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Type = request.Type,
            AmountCents = request.AmountCents,
            Description = request.Description,
            Date = request.Date,
            Recurrence = request.Recurrence
        };

        // Update account balance
        if (transaction.Type == TransactionType.INCOME)
            account.AddBalance(transaction.AmountCents);
        else
            account.SubtractBalance(transaction.AmountCents);

        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.CreateAsync(transaction);

        return _mapper.Map<TransactionDto>(transaction);
    }
}

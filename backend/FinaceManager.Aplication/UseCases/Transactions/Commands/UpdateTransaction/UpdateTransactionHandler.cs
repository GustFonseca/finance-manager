using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.UpdateTransaction;

public class UpdateTransactionHandler : IRequestHandler<UpdateTransactionCommand, TransactionDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public UpdateTransactionHandler(
        ITransactionRepository transactionRepository,
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        IMerchantRepository merchantRepository,
        IUserRepository userRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
        _categoryRepository = categoryRepository;
        _merchantRepository = merchantRepository;
        _userRepository = userRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<TransactionDto> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken = default)
    {
        var transaction = await _transactionRepository.GetOwnedAsync(request.TransactionId, request.UserId);

        var description = TransactionInput.Validate(request.AmountCents, request.Description, request.Type, request.Recurrence);
        var (account, category) = await TransactionInput.LoadReferencesAsync(
            _accountRepository, _categoryRepository, request.UserId, request.AccountId, request.CategoryId, request.Type);

        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var owner = await _userRepository.GetByIdAsync(request.UserId);
        var merchant = await MerchantCatalog.FileAsync(
            _merchantRepository, rules, request.UserId, description, owner?.Name, category,
            learnCategory: transaction.CategoryId != category.Id);

        var previousAccount = await _accountRepository.GetByIdAsync(transaction.AccountId)
            ?? throw new NotFoundException("Conta não encontrada.");
        previousAccount.Reverse(transaction);

        transaction.AccountId = account.Id;
        transaction.Account = account;
        transaction.CategoryId = category.Id;
        transaction.Category = category;
        transaction.Type = request.Type;
        transaction.AmountCents = request.AmountCents;
        transaction.Description = description;
        transaction.Date = TransactionInput.ToUtc(request.Date);
        transaction.Recurrence = request.Recurrence;
        transaction.MerchantId = merchant?.Id;
        transaction.Merchant = merchant;
        account.Record(transaction);

        if (previousAccount.Id != account.Id) await _accountRepository.UpdateAsync(previousAccount);
        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.UpdateAsync(transaction);

        return transaction.ToDto();
    }
}

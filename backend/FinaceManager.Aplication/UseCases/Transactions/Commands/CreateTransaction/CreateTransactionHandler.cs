using AutoMapper;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;

public class CreateTransactionHandler : IRequestHandler<CreateTransactionCommand, TransactionDto>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public CreateTransactionHandler(
        ITransactionRepository transactionRepository,
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        IMerchantRepository merchantRepository,
        IUserRepository userRepository,
        IMapper mapper,
        IClassificationRulesProvider rulesProvider)
    {
        _rulesProvider = rulesProvider;
        _transactionRepository = transactionRepository;
        _accountRepository = accountRepository;
        _categoryRepository = categoryRepository;
        _merchantRepository = merchantRepository;
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<TransactionDto> Handle(CreateTransactionCommand request, CancellationToken cancellationToken = default)
    {
        TransactionInput.Validate(request.AmountCents, request.Description);
        var (account, category) = await TransactionInput.LoadReferencesAsync(
            _accountRepository, _categoryRepository, request.UserId, request.AccountId, request.CategoryId, request.Type);

        var owner = await _userRepository.GetByIdAsync(request.UserId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var merchant = await MerchantCatalog.FileAsync(
            _merchantRepository, rules, request.UserId, request.Description, owner?.Name, category);

        var transaction = new Transaction
        {
            UserId = request.UserId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Type = request.Type,
            AmountCents = request.AmountCents,
            Description = request.Description,
            Date = TransactionInput.ToUtc(request.Date),
            Recurrence = request.Recurrence,
            MerchantId = merchant?.Id,
            Merchant = merchant,
        };

        TransactionInput.ApplyToBalance(account, transaction.Type, transaction.AmountCents);

        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.CreateAsync(transaction);

        return _mapper.Map<TransactionDto>(transaction);
    }
}

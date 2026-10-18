using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;

public class ImportTransactionsHandler : IRequestHandler<ImportTransactionsCommand, int>
{
    public const int MaxLines = 2000;

    private readonly ITransactionRepository _transactionRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public ImportTransactionsHandler(
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

    public async Task<int> Handle(ImportTransactionsCommand request, CancellationToken cancellationToken = default)
    {
        if (request.Lines.Count == 0) throw new BusinessRuleException("Nenhuma transação selecionada.");
        if (request.Lines.Count > MaxLines) throw new BusinessRuleException($"No máximo {MaxLines} transações por importação.");

        var account = await _accountRepository.GetByIdAsync(request.AccountId);
        if (account == null || account.UserId != request.UserId) throw new BusinessRuleException("Conta não encontrada.");
        var categories = (await _categoryRepository.GetByUserIdAsync(request.UserId)).ToDictionary(c => c.Id);
        var owner = await _userRepository.GetByIdAsync(request.UserId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var merchants = new Dictionary<string, Merchant>();

        var transactions = new List<Transaction>();
        foreach (var (line, index) in request.Lines.Select((l, i) => (l, i)))
        {
            try
            {
                TransactionInput.Validate(line.AmountCents, line.Description);
                var category = categories.GetValueOrDefault(line.CategoryId)
                    ?? throw new BusinessRuleException("Categoria não encontrada.");
                TransactionInput.EnsureCategoryFits(category, line.Type);

                var merchant = await MerchantCatalog.FileAsync(
                    _merchantRepository, rules, request.UserId, line.Description, owner?.Name, category, cache: merchants);

                transactions.Add(new Transaction
                {
                    UserId = request.UserId,
                    AccountId = account.Id,
                    CategoryId = category.Id,
                    Type = line.Type,
                    AmountCents = line.AmountCents,
                    Description = line.Description,
                    Date = TransactionInput.ToUtc(line.Date),
                    MerchantId = merchant?.Id,
                });
                TransactionInput.ApplyToBalance(account, line.Type, line.AmountCents);
            }
            catch (BusinessRuleException ex)
            {
                throw new BusinessRuleException($"Linha {index + 1} ({line.Description}): {ex.Message}");
            }
        }

        await _accountRepository.UpdateAsync(account);
        await _transactionRepository.CreateRangeAsync(transactions);
        return transactions.Count;
    }
}

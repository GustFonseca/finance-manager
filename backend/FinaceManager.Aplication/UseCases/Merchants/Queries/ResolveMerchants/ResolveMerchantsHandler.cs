using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;

public class ResolveMerchantsHandler : IRequestHandler<ResolveMerchantsQuery, List<MerchantMatchDto>>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public ResolveMerchantsHandler(
        IMerchantRepository merchantRepository,
        ICategoryRepository categoryRepository,
        IUserRepository userRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _merchantRepository = merchantRepository;
        _categoryRepository = categoryRepository;
        _userRepository = userRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<List<MerchantMatchDto>> Handle(ResolveMerchantsQuery request, CancellationToken cancellationToken = default)
    {
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var owner = await _userRepository.GetByIdAsync(request.UserId);
        var known = (await _merchantRepository.GetByUserIdAsync(request.UserId)).ToDictionary(m => m.Key);
        var categories = await _categoryRepository.GetByUserIdAsync(request.UserId);

        return request.Lines.Select(line =>
        {
            var parsed = MerchantParser.Parse(line.Description, rules, owner?.Name);
            var merchant = parsed == null ? null : known.GetValueOrDefault(parsed.Key);
            var kind = merchant?.Kind ?? parsed?.Kind;
            return new MerchantMatchDto
            {
                Description = line.Description,
                Name = merchant?.Name ?? parsed?.Name ?? string.Empty,
                Kind = kind,
                MerchantId = merchant?.Id,
                CategoryId = SuggestCategory(line, merchant, categories, rules)?.Id,
                SkipReason = kind == MerchantKind.OWN
                    ? $"{merchant?.Name ?? parsed!.Name}: movimentação entre suas contas, não é renda nem gasto"
                    : null,
            };
        }).ToList();
    }

    private static Category? SuggestCategory(ImportLineRequest line, Merchant? merchant, List<Category> categories, ClassificationRules rules)
    {
        var type = line.Type == TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
        var ofType = categories.Where(c => c.Type == type).ToList();

        var learned = ofType.FirstOrDefault(c => c.Id == merchant?.CategoryId);
        if (learned != null) return learned;

        var hint = rules.CategoryHint($"{merchant?.Name} {line.Description}");
        var hinted = hint == null ? null : ofType.FirstOrDefault(c => MoneyText.Key(c.Name) == MoneyText.Key(hint));
        return hinted ?? ofType.FirstOrDefault(c => rules.IsCatchAll(c.Name)) ?? ofType.FirstOrDefault();
    }
}

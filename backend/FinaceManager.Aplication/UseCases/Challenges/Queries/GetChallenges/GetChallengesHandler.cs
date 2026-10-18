using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Challenges.Queries.GetChallenges;

public class GetChallengesHandler : IRequestHandler<GetChallengesQuery, List<ChallengeDto>>
{
    private readonly IChallengeRepository _challengeRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetChallengesHandler(
        IChallengeRepository challengeRepository,
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        IMerchantRepository merchantRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _challengeRepository = challengeRepository;
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _merchantRepository = merchantRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<List<ChallengeDto>> Handle(GetChallengesQuery request, CancellationToken cancellationToken = default)
    {
        var challenges = await _challengeRepository.GetByUserIdAsync(request.UserId);
        if (challenges.Count == 0) return [];

        var since = challenges.Min(c => c.StartsOn).AddDays(-ChallengeTracker.BaselineDays);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now);
        var categories = (await _categoryRepository.GetByUserIdAsync(request.UserId)).ToDictionary(c => c.Id, c => c.Name);
        var merchants = (await _merchantRepository.GetByUserIdAsync(request.UserId)).ToDictionary(m => m.Id, m => m.Name);
        var rules = await _rulesProvider.GetAsync(cancellationToken);

        return challenges
            .Select(c => ChallengeTracker.Track(c, transactions, request.Now, TargetName(c, categories, merchants), rules))
            .OrderBy(c => c.Status)
            .ThenByDescending(c => c.StartsOn)
            .ToList();
    }

    private static string TargetName(Challenge challenge, Dictionary<Guid, string> categories, Dictionary<Guid, string> merchants) => challenge.Scope switch
    {
        ChallengeScope.CATEGORY => challenge.TargetId is { } c && categories.TryGetValue(c, out var category) ? category : "Categoria removida",
        ChallengeScope.MERCHANT => challenge.TargetId is { } m && merchants.TryGetValue(m, out var merchant) ? merchant : "Estabelecimento removido",
        _ => "Gastos supérfluos",
    };
}

using System.Text.RegularExpressions;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Queries.TestRule;

public class TestRuleHandler : IRequestHandler<TestRuleQuery, RuleTestDto>
{
    public const int LookbackMonths = 12;
    public const int MaxSamples = 20;

    private readonly ITransactionRepository _transactionRepository;

    public TestRuleHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<RuleTestDto> Handle(TestRuleQuery request, CancellationToken cancellationToken = default)
    {
        var problem = RuleCatalog.PatternError(request.Pattern?.Trim() ?? string.Empty);
        if (problem != null) return new RuleTestDto { Valid = false, Error = problem };

        var regex = new Regex(request.Pattern!.Trim(), RegexOptions.CultureInvariant | RegexOptions.IgnoreCase, RuleCatalog.TestTimeout);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Now.AddMonths(-LookbackMonths), request.Now);
        var texts = transactions
            .Select(t => $"{t.Merchant?.Name} {t.Merchant?.Activity} {t.Description}".Trim())
            .Distinct()
            .ToList();
        var matches = new List<string>();
        try
        {
            matches = texts.Where(text => regex.IsMatch(MoneyText.Plain(text))).ToList();
        }
        catch (RegexMatchTimeoutException)
        {
            return new RuleTestDto { Valid = false, Error = "O padrão demorou demais para ser testado. Simplifique a expressão." };
        }

        return new RuleTestDto
        {
            Valid = true,
            MatchCount = matches.Count,
            CheckedCount = texts.Count,
            Samples = matches.Take(MaxSamples).ToList(),
        };
    }
}

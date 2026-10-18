using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class ChallengeTracker
{
    public const int BaselineDays = 90;
    public const int MaxDays = 90;

    public static ChallengeDto Track(Challenge challenge, IEnumerable<Transaction> transactions, DateTime now, string targetName, ClassificationRules rules)
    {
        var endsOn = challenge.StartsOn.AddDays(challenge.Days);
        var until = now < endsOn ? now : endsOn;
        var elapsed = Math.Clamp((int)Math.Ceiling((until - challenge.StartsOn).TotalDays), 0, challenge.Days);
        var inScope = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && !t.IsOwnMoney(rules) && Matches(challenge, t, rules))
            .ToList();
        var spent = inScope.Where(t => t.Date >= challenge.StartsOn && t.Date < endsOn && t.Date <= now).Sum(t => t.AmountCents);
        var before = inScope.Where(t => t.Date >= challenge.StartsOn.AddDays(-BaselineDays) && t.Date < challenge.StartsOn).Sum(t => t.AmountCents);
        var baseline = before * elapsed / BaselineDays;

        return new ChallengeDto
        {
            Id = challenge.Id,
            Name = challenge.Name,
            Scope = challenge.Scope,
            TargetId = challenge.TargetId,
            TargetName = targetName,
            LimitCents = challenge.LimitCents,
            StartsOn = challenge.StartsOn,
            EndsOn = endsOn,
            Days = challenge.Days,
            DaysElapsed = elapsed,
            SpentCents = spent,
            BaselineCents = baseline,
            SavedCents = Math.Max(0, baseline - spent),
            Status = spent > challenge.LimitCents ? ChallengeStatus.LOST
                : now >= endsOn ? ChallengeStatus.WON
                : ChallengeStatus.ACTIVE,
        };
    }

    private static bool Matches(Challenge challenge, Transaction t, ClassificationRules rules) => challenge.Scope switch
    {
        ChallengeScope.CATEGORY => t.CategoryId == challenge.TargetId,
        ChallengeScope.MERCHANT => t.MerchantId == challenge.TargetId,
        _ => SpendingClassifier.Classify(t, rules) == SpendingClass.SUPERFLUOUS,
    };
}

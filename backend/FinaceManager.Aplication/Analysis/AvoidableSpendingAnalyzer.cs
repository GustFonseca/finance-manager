using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class AvoidableSpendingAnalyzer
{
    public const int LookbackMonths = 12;
    public const int AverageMonths = 3;
    public const long SmallPurchaseCents = 3_000;
    public const double SmallPurchaseTimesPerMonth = 4;
    public const double SpikeRatio = 1.5;
    public const long MinSpikeCents = 5_000;
    public const int RobustSpikeMinMonths = 3;
    public const double SpikeDeviations = 3;
    public const long FirstTimeMinCents = 20_000;
    public const double SuperfluousCut = 0.5;
    public const double PriceIncreaseTolerance = 0.02;
    public const int ActiveWithinDays = 45;
    public const int ResumedGapDays = 45;

    private sealed record Expense(Transaction Tx, SpendingClass Class, string Key, string Name);

    public static AvoidableSpendingDto Analyze(
        IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules, decimal cdiAnnualPercent,
        AvoidableContext? context = null)
    {
        context ??= AvoidableContext.Empty;
        var expenses = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now && !t.IsOwnMoney(rules))
            .Select(t => new Expense(t, SpendingClassifier.Classify(t, rules), t.MerchantKey(rules), t.MerchantName(rules)))
            .ToList();
        var current = expenses.Where(e => e.Tx.Date >= monthStart && e.Tx.Date < monthStart.AddMonths(1)).ToList();
        var history = expenses.Where(e => e.Tx.Date >= monthStart.AddMonths(-AverageMonths) && e.Tx.Date < monthStart).ToList();
        var historyMonths = AnalysisHistory.MonthsWithData(history.Select(e => e.Tx), monthStart, AverageMonths);
        var divisor = Math.Max(1, historyMonths);
        var monthlyRate = MonthlyRate(cdiAnnualPercent);

        var monthCents = Sum(current.Where(e => e.Class == SpendingClass.SUPERFLUOUS));
        var monthlyAverage = historyMonths > 0
            ? Sum(history.Where(e => e.Class == SpendingClass.SUPERFLUOUS)) / divisor
            : monthCents;

        return new AvoidableSpendingDto
        {
            MonthCents = monthCents,
            MonthlyAverageCents = monthlyAverage,
            YearProjectionCents = monthlyAverage * 12,
            InvestedIn12MonthsCents = Invested(monthlyAverage, monthlyRate),
            CdiAnnualPercent = cdiAnnualPercent,
            HistoryMonths = historyMonths,
            Superfluous = SuperfluousMerchants(current, history, divisor, historyMonths, monthlyRate),
            Subscriptions = Subscriptions(expenses, now, rules, monthlyRate, context.Decisions, out var similar),
            SimilarSubscriptions = similar,
            SmallPurchases = SmallPurchases(historyMonths > 0 ? history : current, divisor),
            Spikes = Spikes(current, expenses, monthStart, rules),
            FirstTimePurchases = FirstTimePurchases(current, expenses, monthStart),
            Fees = FeeAnalyzer.Analyze(transactions, monthStart, now, rules),
            Duplicates = DuplicateChargeDetector.Detect(transactions, monthStart, now, rules, context.Dismissed),
            BillIncreases = BillIncreaseDetector.Detect(transactions, monthStart, now, rules, context.InflationPercent, context.Dismissed),
            InflationPercent = context.InflationPercent,
        };
    }

    public static double MonthlyRate(decimal annualPercent) =>
        Math.Pow(1 + (double)annualPercent / 100, 1.0 / 12) - 1;

    public static long Invested(long monthlyCents, double monthlyRate) =>
        monthlyRate <= 0
            ? monthlyCents * 12
            : (long)Math.Round(monthlyCents * (Math.Pow(1 + monthlyRate, 12) - 1) / monthlyRate);

    private static List<AvoidableMerchantDto> SuperfluousMerchants(
        List<Expense> current, List<Expense> history, int divisor, int historyMonths, double monthlyRate) =>
        current
            .Where(e => e.Class == SpendingClass.SUPERFLUOUS)
            .GroupBy(e => e.Key)
            .Select(g =>
            {
                var latest = g.MaxBy(e => e.Tx.Date)!;
                var average = historyMonths > 0 ? Sum(history.Where(e => e.Key == g.Key)) / divisor : Sum(g);
                var cut = (long)(Math.Max(average, Sum(g)) * SuperfluousCut);
                return new AvoidableMerchantDto
                {
                    MerchantId = latest.Tx.MerchantId,
                    Name = latest.Name,
                    CategoryName = latest.Tx.Category?.Name ?? string.Empty,
                    Count = g.Count(),
                    MonthCents = Sum(g),
                    MonthlyAverageCents = average,
                    CutCents = cut,
                    CutInvestedIn12MonthsCents = Invested(cut, monthlyRate),
                };
            })
            .OrderByDescending(m => m.MonthCents)
            .ToList();

    private static List<SubscriptionAuditDto> Subscriptions(
        List<Expense> expenses, DateTime now, ClassificationRules rules, double monthlyRate,
        IReadOnlyDictionary<string, SubscriptionDecision> decisions, out List<SimilarSubscriptionsDto> similar)
    {
        var audits = expenses
            .Where(e => rules.IsSubscription($"{e.Name} {e.Tx.Description}"))
            .GroupBy(e => e.Key)
            .Select(g => g.OrderBy(e => e.Tx.Date).ToList())
            .Where(charges => (now - charges[^1].Tx.Date).TotalDays <= ActiveWithinDays)
            .Select(charges =>
            {
                var latest = charges[^1];
                var previous = charges.Take(charges.Count - 1).LastOrDefault(e => e.Tx.AmountCents != latest.Tx.AmountCents);
                var resumed = charges.Count > 1 && (latest.Tx.Date - charges[^2].Tx.Date).TotalDays > ResumedGapDays
                    ? charges[^2].Tx.Date
                    : (DateTime?)null;
                var decision = decisions.GetValueOrDefault(latest.Key);
                return new SubscriptionAuditDto
                {
                    Key = latest.Key,
                    Choice = decision?.Choice,
                    DecidedAt = decision?.DecidedAt,
                    ChargedAfterCancel = decision?.Choice == SubscriptionChoice.CANCEL && latest.Tx.Date > decision.DecidedAt,
                    MerchantId = latest.Tx.MerchantId,
                    Name = latest.Name,
                    Group = rules.SubscriptionGroup(latest.Name) ?? rules.SubscriptionGroup(latest.Tx.Description),
                    MonthlyCents = latest.Tx.AmountCents,
                    YearlyCents = latest.Tx.AmountCents * 12,
                    PreviousCents = previous?.Tx.AmountCents,
                    PriceIncreased = previous != null && latest.Tx.AmountCents > previous.Tx.AmountCents * (1 + PriceIncreaseTolerance),
                    LastDate = latest.Tx.Date,
                    ResumedAfter = resumed,
                    InvestedIn12MonthsCents = Invested(latest.Tx.AmountCents, monthlyRate),
                };
            })
            .OrderByDescending(s => s.MonthlyCents)
            .ToList();

        similar = audits
            .Where(s => s.Group != null)
            .GroupBy(s => s.Group!)
            .Where(g => g.Count() > 1)
            .Select(g => new SimilarSubscriptionsDto
            {
                Group = g.Key,
                Names = g.Select(s => s.Name).ToList(),
                MonthlyCents = g.Sum(s => s.MonthlyCents),
            })
            .OrderByDescending(s => s.MonthlyCents)
            .ToList();
        return audits;
    }

    private static SmallPurchasesDto SmallPurchases(List<Expense> window, int months)
    {
        var merchants = window
            .Where(e => e.Class != SpendingClass.ESSENTIAL && e.Tx.AmountCents < SmallPurchaseCents)
            .GroupBy(e => e.Key)
            .Select(g =>
            {
                var latest = g.MaxBy(e => e.Tx.Date)!;
                return new SmallPurchaseMerchantDto
                {
                    MerchantId = latest.Tx.MerchantId,
                    Name = latest.Name,
                    MonthlyCents = Sum(g) / months,
                    TimesPerMonth = Math.Round((double)g.Count() / months, 1),
                    AverageTicketCents = Sum(g) / g.Count(),
                };
            })
            .Where(m => m.TimesPerMonth >= SmallPurchaseTimesPerMonth)
            .OrderByDescending(m => m.MonthlyCents)
            .ToList();

        return new SmallPurchasesDto
        {
            LimitCents = SmallPurchaseCents,
            MonthlyCents = merchants.Sum(m => m.MonthlyCents),
            TimesPerMonth = Math.Round(merchants.Sum(m => m.TimesPerMonth), 1),
            Merchants = merchants,
        };
    }

    private static List<SpendingSpikeDto> Spikes(
        List<Expense> current, List<Expense> expenses, DateTime monthStart, ClassificationRules rules)
    {
        var months = Enumerable.Range(1, LookbackMonths)
            .Select(i => monthStart.AddMonths(-i))
            .Where(m => expenses.Any(e => e.Tx.Date >= m && e.Tx.Date < m.AddMonths(1)))
            .ToList();
        if (months.Count == 0) return [];

        var history = expenses
            .Where(e => e.Tx.Date >= monthStart.AddMonths(-LookbackMonths) && e.Tx.Date < monthStart)
            .Select(e => (Expense: e, Month: months.FindIndex(m => e.Tx.Date >= m && e.Tx.Date < m.AddMonths(1))))
            .Where(e => e.Month >= 0)
            .ToList();
        Dictionary<TKey, long[]> Totals<TKey>(Func<Expense, TKey> keyOf) where TKey : notnull
        {
            var totals = new Dictionary<TKey, long[]>();
            foreach (var (expense, month) in history)
            {
                var key = keyOf(expense);
                if (!totals.TryGetValue(key, out var series)) totals[key] = series = new long[months.Count];
                series[month] += expense.Tx.AmountCents;
            }
            return totals;
        }
        var byKey = Totals(e => e.Key);
        var byCategory = Totals(e => e.Tx.CategoryId);
        List<long> Series<TKey>(Dictionary<TKey, long[]> totals, TKey key) where TKey : notnull =>
            totals.TryGetValue(key, out var series) ? [.. series] : [.. new long[months.Count]];

        var byMerchant = current
            .Where(e => e.Class != SpendingClass.ESSENTIAL)
            .GroupBy(e => e.Key)
            .Select(g => Spike(SpikeKind.MERCHANT, g.MaxBy(e => e.Tx.Date)!.Tx.MerchantId, g.MaxBy(e => e.Tx.Date)!.Name,
                Sum(g), Series(byKey, g.Key)));
        var byCategorySpikes = current
            .Where(e => e.Tx.Category != null && rules.CategoryClass(e.Tx.Category.Name) != SpendingClass.ESSENTIAL)
            .GroupBy(e => e.Tx.CategoryId)
            .Select(g => Spike(SpikeKind.CATEGORY, g.Key, g.First().Tx.Category!.Name,
                Sum(g), Series(byCategory, g.Key)));

        return byCategorySpikes.Concat(byMerchant)
            .Where(s => s != null)
            .Select(s => s!)
            .OrderByDescending(s => s.MonthCents - s.AverageCents)
            .ToList();
    }

    private static SpendingSpikeDto? Spike(SpikeKind kind, Guid? id, string name, long month, List<long> series)
    {
        var average = series.Sum() / series.Count;
        if (average <= 0) return null;
        var threshold = SpikeThreshold(series, average);
        return month > threshold && month - Math.Max(average, Median(series)) >= MinSpikeCents
            ? new SpendingSpikeDto
            {
                Kind = kind, Id = id, Name = name, MonthCents = month, AverageCents = average,
                ThresholdCents = threshold, Ratio = Math.Round((double)month / average, 1),
            }
            : null;
    }

    public static long SpikeThreshold(IReadOnlyList<long> series, long average)
    {
        var floor = (long)Math.Ceiling(average * SpikeRatio);
        if (series.Count < RobustSpikeMinMonths) return floor;
        var median = Median(series);
        var deviation = Median(series.Select(v => Math.Abs(v - median)).ToList());
        var robust = median + (long)Math.Ceiling(SpikeDeviations * 1.4826 * deviation);
        return Math.Max(robust, (long)Math.Ceiling(Math.Max(median, average) * SpikeRatio));
    }

    public static long Median(IReadOnlyList<long> values)
    {
        if (values.Count == 0) return 0;
        var sorted = values.Order().ToList();
        var middle = sorted.Count / 2;
        return sorted.Count % 2 == 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }

    private static List<FirstTimePurchaseDto> FirstTimePurchases(List<Expense> current, List<Expense> expenses, DateTime monthStart)
    {
        var seenBefore = expenses
            .Where(e => e.Tx.Date < monthStart && e.Tx.Date >= monthStart.AddMonths(-LookbackMonths))
            .Select(e => e.Key)
            .ToHashSet();
        return current
            .Where(e => e.Class != SpendingClass.ESSENTIAL && e.Tx.AmountCents >= FirstTimeMinCents && !seenBefore.Contains(e.Key))
            .OrderByDescending(e => e.Tx.AmountCents)
            .Select(e => new FirstTimePurchaseDto
            {
                TransactionId = e.Tx.Id,
                MerchantId = e.Tx.MerchantId,
                Name = e.Name,
                Cents = e.Tx.AmountCents,
                Date = e.Tx.Date,
                Class = e.Class,
            })
            .ToList();
    }

    private static long Sum(IEnumerable<Expense> expenses) => expenses.Sum(e => e.Tx.AmountCents);
}

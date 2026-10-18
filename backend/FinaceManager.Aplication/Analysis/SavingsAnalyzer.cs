using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <param name="Transactions">The current month up to <paramref name="Now"/> and the <see cref="SavingsAnalyzer.HistoryMonths"/> before it.</param>
/// <param name="Budgets">Limit per expense category id.</param>
public record SavingsAnalysisInput(
    IReadOnlyList<Transaction> Transactions,
    IReadOnlyList<Category> ExpenseCategories,
    IReadOnlyDictionary<Guid, long> Budgets,
    long GoalCents,
    DateTime MonthStart,
    DateTime Now,
    IReadOnlyList<RecurringExpenseDto> Recurring);

/// <summary>
/// The savings plan: how the month is going against the goal and the budgets,
/// suggested limits, and what could be cut — all from the user's own history.
/// </summary>
public static class SavingsAnalyzer
{
    /// <summary>Months of history used for averages (those with data).</summary>
    public const int HistoryMonths = 3;
    /// <summary>Flexible categories are suggested this cut even when the goal is met…</summary>
    private const double BaseCut = 0.10;
    /// <summary>…and never more than this, however far the goal is.</summary>
    private const double MaxCut = 0.30;
    /// <summary>Spending pace above the average by this factor is flagged.</summary>
    private const double TrendThreshold = 1.2;
    /// <summary>Budgets this used are flagged before they run out.</summary>
    private const double NearLimit = 0.8;
    /// <summary>How many "reduce this category" suggestions to show.</summary>
    private const int CategoryCuts = 3;
    /// <summary>How many merchant habits to suggest reducing.</summary>
    private const int HabitCuts = 4;
    /// <summary>Category cuts smaller than this per month aren't worth a suggestion.</summary>
    private const long MinCategoryCutCents = 2_000;
    /// <summary>Above this share of spending, "Outros" hides too much for precise advice.</summary>
    private const double UnsortedShare = 0.2;
    /// <summary>The catch-all category (normalized name).</summary>
    private const string CatchAll = "outros";

    /// <summary>Categories kept at their average instead of cut (by normalized name).</summary>
    private static readonly HashSet<string> Essential = ["moradia", "saude", "educacao"];

    public static SavingsPlanDto Analyze(SavingsAnalysisInput input)
    {
        var monthEnd = input.MonthStart.AddMonths(1);
        var historyStart = input.MonthStart.AddMonths(-HistoryMonths);
        // Investments, the card bill and the user's own accounts are neither earned nor spent.
        var transactions = input.Transactions.Where(t => !t.IsOwnMoney()).ToList();
        var current = transactions.Where(t => t.Date >= input.MonthStart && t.Date < monthEnd).ToList();
        var history = transactions.Where(t => t.Date >= historyStart && t.Date < input.MonthStart).ToList();
        var elapsed = Math.Clamp((input.Now - input.MonthStart) / (monthEnd - input.MonthStart), 0.01, 1);
        var historyMonths = AnalysisHistory.MonthsWithData(history, input.MonthStart, HistoryMonths);
        var divisor = Math.Max(1, historyMonths);

        var monthIncome = Sum(current, TransactionType.INCOME);
        var monthExpense = Sum(current, TransactionType.EXPENSE);
        var averageSaved = (Sum(history, TransactionType.INCOME) - Sum(history, TransactionType.EXPENSE)) / divisor;

        var budgets = input.ExpenseCategories.Select(c => new CategoryBudgetDto
        {
            CategoryId = c.Id,
            CategoryName = c.Name,
            Color = c.Color,
            LimitCents = input.Budgets.TryGetValue(c.Id, out var limit) ? limit : null,
            SpentCents = SumCategory(current, c.Id),
            AverageCents = SumCategory(history, c.Id) / divisor,
            Essential = Essential.Contains(MoneyText.Key(c.Name)),
        }).ToList();

        var gap = Math.Max(0, input.GoalCents - averageSaved);
        // A limit can't cut a bill: the fixed charges of each category stay out of the cuts.
        var fixedByCategory = input.Recurring
            .GroupBy(r => r.CategoryName)
            .ToDictionary(g => g.Key, g => g.Sum(r => r.MonthlyCents));
        SuggestLimits(budgets, gap, fixedByCategory);

        var projected = ProjectMonth(current, input.Recurring, elapsed);
        var habits = SpendingAnalyzer.Habits(history, historyMonths)
            .Where(h => !h.Subscription)
            .Take(HabitCuts)
            .ToList();
        var savings = new List<SavingsSuggestionDto>();
        savings.AddRange(SubscriptionSuggestions(input.Recurring));
        savings.AddRange(habits.Select(HabitSuggestion));
        var trends = TrendWarnings(budgets, projected).ToList();
        // A category already flagged, or whose habits are suggested, isn't cut again on top.
        var covered = trends.Select(t => t.CategoryId).Concat(habits.Select(h => h.CategoryId)).ToHashSet();
        savings.AddRange(CategoryCutSuggestions(budgets, covered));
        var potential = savings.Sum(s => s.PotentialCents);

        var suggestions = new List<SavingsSuggestionDto>();
        if (input.GoalCents > 0) suggestions.Add(GoalSuggestion(input.GoalCents, averageSaved, gap, historyMonths, potential));
        suggestions.AddRange(BudgetWarnings(budgets, projected));
        suggestions.AddRange(trends.Select(t => t.Suggestion));
        var unsorted = UnsortedSuggestion(budgets);
        if (unsorted != null) suggestions.Add(unsorted);
        suggestions.AddRange(savings.OrderByDescending(s => s.PotentialCents));

        return new SavingsPlanDto
        {
            MonthlyGoalCents = input.GoalCents,
            MonthIncomeCents = monthIncome,
            MonthExpenseCents = monthExpense,
            MonthSavedCents = monthIncome - monthExpense,
            AverageSavedCents = averageSaved,
            HistoryMonths = historyMonths,
            MonthProgress = elapsed,
            Budgets = budgets.OrderByDescending(b => b.AverageCents).ThenBy(b => b.CategoryName).ToList(),
            Suggestions = suggestions,
            PotentialSavingsCents = potential,
        };
    }

    /// <summary>
    /// Essentials keep their average. In flexible categories only the variable part
    /// (average minus fixed charges) is cut: <see cref="BaseCut"/>, or its share of
    /// the goal gap in proportion to its spending, up to <see cref="MaxCut"/>.
    /// </summary>
    private static void SuggestLimits(List<CategoryBudgetDto> budgets, long gap, IReadOnlyDictionary<string, long> fixedByCategory)
    {
        long Variable(CategoryBudgetDto b) =>
            Math.Max(0, b.AverageCents - fixedByCategory.GetValueOrDefault(b.CategoryName));

        var flexibleTotal = budgets.Where(b => !b.Essential).Sum(Variable);
        foreach (var budget in budgets)
        {
            var variable = Variable(budget);
            if (budget.Essential || variable == 0)
            {
                budget.SuggestedLimitCents = RoundUp(budget.AverageCents);
                continue;
            }
            var share = flexibleTotal > 0 ? (double)gap * variable / flexibleTotal : 0;
            var cut = Math.Min(Math.Max(BaseCut * variable, share), MaxCut * variable);
            budget.SuggestedLimitCents = RoundUp((long)(budget.AverageCents - cut));
        }
    }

    private static SavingsSuggestionDto GoalSuggestion(long goal, long averageSaved, long gap, int historyMonths, long potential) => gap > 0
        ? new SavingsSuggestionDto
        {
            Kind = SuggestionKind.GOAL,
            Title = $"Faltam {MoneyText.Format(gap)} por mês para a sua meta",
            Detail = $"{(historyMonths == 1 ? "No último mês" : $"Nos últimos {historyMonths} meses")} você economizou em média " +
                     $"{MoneyText.Format(averageSaved, signed: averageSaved < 0)} por mês. " +
                     (potential >= gap
                         ? $"As sugestões abaixo somam {MoneyText.Format(potential)} por mês e cobrem essa diferença."
                         : $"As sugestões abaixo somam {MoneyText.Format(potential)} por mês; para chegar à meta, " +
                           "siga também os limites sugeridos por categoria ou ajuste a meta."),
            PotentialCents = gap,
        }
        : new SavingsSuggestionDto
        {
            Kind = SuggestionKind.GOAL,
            Title = "Você está no ritmo da sua meta",
            Detail = $"Média de {MoneyText.Format(averageSaved)} economizados por mês, para uma meta de {MoneyText.Format(goal)}.",
        };

    /// <summary>
    /// Over the limit, or close to it and on pace to go over. A category near its
    /// limit only because a bill was already paid (rent, internet) is fine.
    /// </summary>
    private static IEnumerable<SavingsSuggestionDto> BudgetWarnings(
        IEnumerable<CategoryBudgetDto> budgets, IReadOnlyDictionary<Guid, long> projectedByCategory)
    {
        foreach (var b in budgets.Where(b => b.LimitCents > 0))
        {
            var limit = b.LimitCents!.Value;
            var used = (double)b.SpentCents / limit;
            var projected = projectedByCategory.GetValueOrDefault(b.CategoryId);
            if (used <= 1 && (used < NearLimit || projected <= limit)) continue;
            yield return new SavingsSuggestionDto
            {
                Kind = SuggestionKind.BUDGET,
                Title = used > 1 ? $"Orçamento de {b.CategoryName} estourado" : $"Orçamento de {b.CategoryName} quase no limite",
                Detail = $"{MoneyText.Format(b.SpentCents)} gastos de {MoneyText.Format(limit)} ({MoneyText.Percent(used)})" +
                         (used > 1 ? "." : $"; neste ritmo o mês fecha em {MoneyText.Format(projected)}."),
            };
        }
    }

    /// <summary>"Reduza iFood pela metade": a habit at one merchant, with what changing it saves.</summary>
    private static SavingsSuggestionDto HabitSuggestion(ReducibleExpenseDto habit) => new()
    {
        Kind = SuggestionKind.HABIT,
        Title = habit.Class == SpendingClass.SUPERFLUOUS ? $"Reduza {habit.Name} pela metade" : $"Economize em {habit.Name}",
        Detail = habit.Detail,
        PotentialCents = habit.PotentialCents,
    };

    private static IEnumerable<SavingsSuggestionDto> SubscriptionSuggestions(IEnumerable<RecurringExpenseDto> recurring) =>
        recurring
            .Where(r => r.Kind == RecurringKind.SUBSCRIPTION)
            .Select(r => new SavingsSuggestionDto
            {
                Kind = SuggestionKind.SUBSCRIPTION,
                Title = $"Avalie a assinatura {r.Name}",
                Detail = $"{MoneyText.Format(r.MonthlyCents)} por mês, {MoneyText.Format(r.MonthlyCents * 12)} por ano" +
                         (r.AccountName.Length > 0 ? $", cobrada em {r.AccountName}." : "."),
                PotentialCents = r.MonthlyCents,
            });

    /// <summary>
    /// Expected spending per category by the end of the month. Recurring charges
    /// already paid count once (a bill paid on the 15th won't be paid again);
    /// only the variable part is extrapolated from the share of the month elapsed.
    /// </summary>
    private static Dictionary<Guid, long> ProjectMonth(
        IEnumerable<Transaction> current, IEnumerable<RecurringExpenseDto> recurring, double elapsed)
    {
        var fixedCharges = recurring.Select(r => (r.Key, r.AccountId)).ToHashSet();
        return current
            .Where(t => t.Type == TransactionType.EXPENSE)
            .GroupBy(t => t.CategoryId)
            .ToDictionary(g => g.Key, g =>
            {
                var fixedSpent = g.Where(t => fixedCharges.Contains((t.MerchantKey(), t.AccountId))).Sum(t => t.AmountCents);
                var variable = g.Sum(t => t.AmountCents) - fixedSpent;
                return fixedSpent + (long)(variable / elapsed);
            });
    }

    /// <summary>
    /// Flexible categories on pace to end the month well above their average. A
    /// warning about this month, not a monthly saving, so it adds nothing to the potential.
    /// </summary>
    private static IEnumerable<(Guid CategoryId, SavingsSuggestionDto Suggestion)> TrendWarnings(
        List<CategoryBudgetDto> budgets, IReadOnlyDictionary<Guid, long> projectedByCategory)
    {
        foreach (var b in budgets.Where(b => !b.Essential && b.AverageCents > 0 && b.SpentCents > 0))
        {
            var projected = projectedByCategory.GetValueOrDefault(b.CategoryId);
            if (projected <= b.AverageCents * TrendThreshold) continue;
            yield return (b.CategoryId, new SavingsSuggestionDto
            {
                Kind = SuggestionKind.CATEGORY,
                Title = $"{b.CategoryName} está {MoneyText.Percent((double)projected / b.AverageCents - 1)} acima da média",
                Detail = $"Neste ritmo o mês fecha em {MoneyText.Format(projected)}, {MoneyText.Format(projected - b.AverageCents)} " +
                         $"acima da sua média de {MoneyText.Format(b.AverageCents)}.",
            });
        }
    }

    /// <summary>
    /// When much of the spending sits in "Outros", cuts can't be aimed: the user is
    /// asked to give those merchants a category (in Estabelecimentos) first.
    /// </summary>
    private static SavingsSuggestionDto? UnsortedSuggestion(List<CategoryBudgetDto> budgets)
    {
        var total = budgets.Sum(b => b.AverageCents);
        var unsorted = budgets.FirstOrDefault(b => MoneyText.Key(b.CategoryName) == CatchAll);
        if (unsorted == null || total == 0 || (double)unsorted.AverageCents / total < UnsortedShare) return null;
        return new SavingsSuggestionDto
        {
            Kind = SuggestionKind.ORGANIZE,
            Title = $"Organize os gastos em {unsorted.CategoryName}",
            Detail = $"Em média {MoneyText.Format(unsorted.AverageCents)} por mês ({MoneyText.Percent((double)unsorted.AverageCents / total)} dos gastos) " +
                     $"estão em {unsorted.CategoryName}. Defina a categoria desses estabelecimentos em Estabelecimentos para o plano sugerir cortes mais precisos.",
        };
    }

    /// <summary>"Reduza Lazer em 10%", for categories not <paramref name="covered"/> by a warning or a habit.</summary>
    private static IEnumerable<SavingsSuggestionDto> CategoryCutSuggestions(List<CategoryBudgetDto> budgets, IReadOnlySet<Guid> covered)
    {
        var cuts = budgets
            // "Reduza Outros" says nothing: that money is sorted first (see UnsortedSuggestion).
            .Where(b => !b.Essential && !covered.Contains(b.CategoryId) && MoneyText.Key(b.CategoryName) != CatchAll)
            .Where(b => b.AverageCents - b.SuggestedLimitCents >= MinCategoryCutCents)
            .OrderByDescending(b => b.AverageCents - b.SuggestedLimitCents)
            .Take(CategoryCuts);
        foreach (var b in cuts)
        {
            yield return new SavingsSuggestionDto
            {
                Kind = SuggestionKind.CATEGORY,
                Title = $"Reduza {b.CategoryName} em {MoneyText.Percent(1 - (double)b.SuggestedLimitCents / b.AverageCents)}",
                Detail = $"De {MoneyText.Format(b.AverageCents)} para {MoneyText.Format(b.SuggestedLimitCents)} por mês.",
                PotentialCents = b.AverageCents - b.SuggestedLimitCents,
            };
        }
    }

    private static long Sum(IEnumerable<Transaction> transactions, TransactionType type) =>
        transactions.Where(t => t.Type == type).Sum(t => t.AmountCents);

    private static long SumCategory(IEnumerable<Transaction> transactions, Guid categoryId) =>
        transactions.Where(t => t.Type == TransactionType.EXPENSE && t.CategoryId == categoryId).Sum(t => t.AmountCents);

    /// <summary>Suggested limits are round numbers: up to the next R$ 5.</summary>
    private static long RoundUp(long cents) => (cents + 499) / 500 * 500;
}

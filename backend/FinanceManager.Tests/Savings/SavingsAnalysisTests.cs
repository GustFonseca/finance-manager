using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Savings;

public class SavingsAnalysisTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Account Nubank = new(Me, "Nubank");

    // October 2026 in Brasília (UTC-3), halfway through the month.
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);

    private static readonly Category Salario = Cat("Salário", CategoryType.INCOME);
    private static readonly Category Moradia = Cat("Moradia");
    private static readonly Category Alimentacao = Cat("Alimentação");
    private static readonly Category Lazer = Cat("Lazer");

    private static Category Cat(string name, CategoryType type = CategoryType.EXPENSE) =>
        new() { UserId = Me, Name = name, Type = type, Color = "#000" };

    private static Transaction Tx(
        string description, long cents, DateTime date, Category? category = null,
        TransactionType type = TransactionType.EXPENSE, Recurrence recurrence = Recurrence.NONE)
    {
        category ??= Lazer;
        return new Transaction
        {
            UserId = Me,
            Account = Nubank,
            AccountId = Nubank.Id,
            Category = category,
            CategoryId = category.Id,
            Description = description,
            AmountCents = cents,
            Type = type,
            Date = date,
            Recurrence = recurrence,
        };
    }

    private static DateTime Day(int month, int day) => new(2026, month, day, 15, 0, 0, DateTimeKind.Utc);

    // ---- RecurringExpenseDetector ----

    [Fact]
    public void A_monthly_streaming_charge_is_detected_as_a_subscription()
    {
        var recurring = RecurringExpenseDetector.Detect(
            [Tx("NETFLIX.COM", 5590, Day(8, 5)), Tx("NETFLIX.COM", 5590, Day(9, 5)), Tx("Netflix.com", 5590, Day(10, 5))],
            Now);

        var netflix = Assert.Single(recurring);
        Assert.Equal(RecurringKind.SUBSCRIPTION, netflix.Kind);
        Assert.Equal(5590, netflix.MonthlyCents);
        Assert.True(netflix.Detected);
        Assert.Equal("Nubank", netflix.AccountName);
    }

    [Fact]
    public void Rent_paid_every_month_is_a_fixed_cost()
    {
        var recurring = RecurringExpenseDetector.Detect(
            [Tx("Pix enviado - Imobiliária", 150000, Day(8, 10)), Tx("Pix enviado - Imobiliaria", 150000, Day(9, 10)), Tx("Pix enviado - Imobiliária", 155000, Day(10, 10))],
            Now);

        Assert.Equal(RecurringKind.FIXED, Assert.Single(recurring).Kind);
    }

    [Fact]
    public void A_shop_visited_every_week_is_not_recurring()
    {
        var weekly = Enumerable.Range(0, 10).Select(i => Tx("Supermercado", 20000, Day(8, 1).AddDays(i * 7)));

        Assert.Empty(RecurringExpenseDetector.Detect(weekly, Now));
    }

    [Fact]
    public void A_charge_not_seen_for_two_months_is_considered_cancelled()
    {
        var recurring = RecurringExpenseDetector.Detect(
            [Tx("Spotify", 2190, Day(6, 20)), Tx("Spotify", 2190, Day(7, 20)), Tx("Spotify", 2190, Day(8, 14))],
            Now);

        Assert.Empty(recurring);
    }

    [Fact]
    public void A_charge_marked_yearly_counts_one_twelfth_per_month()
    {
        var recurring = RecurringExpenseDetector.Detect(
            [Tx("Anuidade cartão", 120000, Day(9, 1), recurrence: Recurrence.YEARLY)],
            Now);

        var annual = Assert.Single(recurring);
        Assert.Equal(10000, annual.MonthlyCents);
        Assert.False(annual.Detected);
    }

    // ---- SavingsAnalyzer ----

    /// <summary>
    /// July–September: earns R$ 5.000 and spends R$ 3.000 a month (saves R$ 2.000).
    /// Groceries and outings vary month to month, as they do in real life.
    /// </summary>
    private static List<Transaction> History() =>
        [.. new[] { (7, 100000, 50000), (8, 85000, 40000), (9, 115000, 60000) }.SelectMany(m => new[]
        {
            Tx("Salário", 500000, Day(m.Item1, 5), Salario, TransactionType.INCOME),
            Tx("Aluguel", 150000, Day(m.Item1, 10), Moradia),
            Tx("Mercado", m.Item2, Day(m.Item1, 12), Alimentacao),
            Tx("Cinema", m.Item3, Day(m.Item1, 20), Lazer),
        })];

    private static SavingsAnalysisInput Input(
        IEnumerable<Transaction> current, long goalCents, Dictionary<Guid, long>? budgets = null) =>
        new(
            [.. History(), .. current],
            [Moradia, Alimentacao, Lazer],
            budgets ?? [],
            goalCents,
            MonthStart,
            Now,
            RecurringExpenseDetector.Detect([.. History(), .. current], Now));

    [Fact]
    public void The_plan_says_how_many_previous_months_have_transactions()
    {
        Assert.Equal(3, SavingsAnalyzer.Analyze(Input([], goalCents: 0)).HistoryMonths);

        // Statements imported only for the current month: nothing to compare with.
        var onlyThisMonth = new SavingsAnalysisInput(
            [Tx("Mercado", 30000, Day(10, 2), Alimentacao)], [Alimentacao], new Dictionary<Guid, long>(), 0, MonthStart, Now, []);
        var plan = SavingsAnalyzer.Analyze(onlyThisMonth);
        Assert.Equal(0, plan.HistoryMonths);
        Assert.DoesNotContain(plan.Suggestions, s => s.Kind == SuggestionKind.CATEGORY);
    }

    [Fact]
    public void Suggested_limits_close_the_goal_gap_without_cutting_essentials_or_more_than_30_percent()
    {
        var plan = SavingsAnalyzer.Analyze(Input([], goalCents: 250000));

        Assert.Equal(200000, plan.AverageSavedCents);
        var byName = plan.Budgets.ToDictionary(b => b.CategoryName);
        Assert.Equal(150000, byName["Moradia"].SuggestedLimitCents);      // essential: kept
        Assert.Equal(70000, byName["Alimentação"].SuggestedLimitCents);   // gap share is 33%, capped at 30%
        Assert.Equal(35000, byName["Lazer"].SuggestedLimitCents);
        var goal = plan.Suggestions[0];
        Assert.Equal(SuggestionKind.GOAL, goal.Kind);
        Assert.Contains("500,00", goal.Title);
    }

    [Fact]
    public void Flexible_categories_still_get_a_10_percent_suggestion_when_the_goal_is_met()
    {
        var plan = SavingsAnalyzer.Analyze(Input([], goalCents: 100000));

        Assert.Equal("Você está no ritmo da sua meta", plan.Suggestions[0].Title);
        Assert.Equal(90000, plan.Budgets.Single(b => b.CategoryName == "Alimentação").SuggestedLimitCents);
    }

    [Fact]
    public void The_month_so_far_drives_trend_and_budget_warnings()
    {
        var current = new[]
        {
            Tx("Salário", 500000, Day(10, 5), Salario, TransactionType.INCOME),
            Tx("Mercado", 30000, Day(10, 6), Alimentacao),
            Tx("Show", 40000, Day(10, 10), Lazer),      // R$ 400 halfway → ~R$ 790 by month end vs R$ 500 average
        };
        var plan = SavingsAnalyzer.Analyze(Input(current, goalCents: 0, budgets: new() { [Alimentacao.Id] = 35000 }));

        Assert.Equal(500000 - 70000, plan.MonthSavedCents);
        Assert.Contains(plan.Suggestions, s => s.Kind == SuggestionKind.BUDGET && s.Title == "Orçamento de Alimentação quase no limite");
        var trend = Assert.Single(plan.Suggestions, s => s.Title.StartsWith("Lazer está"));
        Assert.True(trend.PotentialCents > 0);
        // Lazer is already flagged, so the "reduce" advice goes to the next category.
        Assert.Contains(plan.Suggestions, s => s.Title == "Reduza Alimentação em 10%");
        Assert.DoesNotContain(plan.Suggestions, s => s.Title.StartsWith("Reduza Lazer"));
    }

    [Fact]
    public void Subscriptions_become_suggestions_and_count_toward_the_potential_savings()
    {
        var netflix = new[] { Tx("Netflix", 5590, Day(8, 5)), Tx("Netflix", 5590, Day(9, 5)), Tx("Netflix", 5590, Day(10, 5)) };

        var plan = SavingsAnalyzer.Analyze(Input(netflix, goalCents: 0));

        var subscription = Assert.Single(plan.Suggestions, s => s.Kind == SuggestionKind.SUBSCRIPTION);
        Assert.Equal("Avalie a assinatura Netflix", subscription.Title);
        Assert.Equal(
            plan.Suggestions.Where(s => s.Kind is SuggestionKind.SUBSCRIPTION or SuggestionKind.CATEGORY).Sum(s => s.PotentialCents),
            plan.PotentialSavingsCents);
    }

    [Fact]
    public void A_monthly_bill_already_paid_is_not_projected_as_a_trend()
    {
        var internet = new[] { 7, 8, 9, 10 }.Select(month => Tx("Vivo Fibra", 11990, Day(month, 15), Lazer)).ToList();
        var input = Input(internet, goalCents: 0) with
        {
            // Only the internet bill in Lazer, so its history average is exactly the bill.
            Transactions = [.. internet],
            Recurring = RecurringExpenseDetector.Detect(internet, Now),
        };

        var plan = SavingsAnalyzer.Analyze(input);

        Assert.DoesNotContain(plan.Suggestions, s => s.Title.StartsWith("Lazer está"));
    }

    [Fact]
    public void A_steady_monthly_charge_from_an_unknown_merchant_needs_three_months()
    {
        Assert.Empty(RecurringExpenseDetector.Detect([Tx("Restaurante", 40000, Day(9, 14)), Tx("Restaurante", 40000, Day(10, 14))], Now));
        Assert.Single(RecurringExpenseDetector.Detect(
            [Tx("Restaurante", 40000, Day(8, 14)), Tx("Restaurante", 40000, Day(9, 14)), Tx("Restaurante", 41000, Day(10, 14))], Now));
    }

    [Fact]
    public void Utility_bills_are_detected_even_when_the_amount_varies()
    {
        var recurring = RecurringExpenseDetector.Detect([Tx("ENEL Energia", 18000, Day(9, 20)), Tx("ENEL Energia", 23000, Day(10, 14))], Now);

        Assert.Equal(RecurringKind.FIXED, Assert.Single(recurring).Kind);
    }

    [Fact]
    public void Suggested_limits_never_go_below_the_fixed_bills_of_a_category()
    {
        var internet = new[] { 7, 8, 9, 10 }.Select(month => Tx("Vivo Fibra", 11990, Day(month, 15), Lazer)).ToList();

        var plan = SavingsAnalyzer.Analyze(Input(internet, goalCents: 0) with
        {
            Transactions = [.. internet],
            Recurring = RecurringExpenseDetector.Detect(internet, Now),
        });

        Assert.True(plan.Budgets.Single(b => b.CategoryName == "Lazer").SuggestedLimitCents >= 11990);
        Assert.DoesNotContain(plan.Suggestions, s => s.Title.StartsWith("Reduza Lazer"));
    }

    [Fact]
    public void A_budget_spent_exactly_is_not_a_warning()
    {
        var rent = new[] { Tx("Salário", 500000, Day(10, 5), Salario, TransactionType.INCOME), Tx("Aluguel", 150000, Day(10, 10), Moradia) };

        var plan = SavingsAnalyzer.Analyze(Input(rent, goalCents: 0, budgets: new() { [Moradia.Id] = 150000 }));

        Assert.DoesNotContain(plan.Suggestions, s => s.Kind == SuggestionKind.BUDGET);
    }

    [Fact]
    public void A_bill_already_paid_close_to_the_limit_is_not_a_warning()
    {
        var internet = new[] { 7, 8, 9, 10 }.Select(month => Tx("Vivo Fibra", 11990, Day(month, 15), Lazer)).ToList();

        var plan = SavingsAnalyzer.Analyze(Input(internet, goalCents: 0, budgets: new() { [Lazer.Id] = 12000 }) with
        {
            Transactions = [.. internet],
            Recurring = RecurringExpenseDetector.Detect(internet, Now),
        });

        Assert.DoesNotContain(plan.Suggestions, s => s.Kind == SuggestionKind.BUDGET);
    }
}

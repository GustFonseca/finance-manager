using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class DailyBudgetFeesAndChallengeTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 21, 18, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Today = new(2026, 10, 21, 0, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = Cat("Lazer");
    private static readonly Category Alimentacao = Cat("Alimentação");
    private static readonly Category Salario = new() { UserId = Me, Name = "Salário", Type = CategoryType.INCOME, Color = "#0f0" };

    private static Category Cat(string name) => new() { UserId = Me, Name = name, Type = CategoryType.EXPENSE, Color = "#123" };

    private static DateTime Day(int month, int day, int hour = 12) => new(2026, month, day, hour, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(string description, long cents, DateTime date, Category? category = null, Merchant? merchant = null) => new()
    {
        UserId = Me,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = category ?? Lazer,
        CategoryId = (category ?? Lazer).Id,
        Merchant = merchant,
        MerchantId = merchant?.Id,
        Description = description,
        AmountCents = cents,
        Type = (category ?? Lazer).Type == CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE,
        Date = date,
    };

    private static Transaction Salary(int month) => Tx("Empresa Acme Ltda", 528000, Day(month, 25), Salario);

    private static DailyBudgetDto Daily(
        IEnumerable<Transaction> transactions, long goal = 0, Dictionary<Guid, long>? budgets = null,
        DateTime? now = null, DateTime? dayStart = null, int hours = 176) =>
        DailyBudgetAnalyzer.Analyze(new DailyBudgetInput(
            transactions.ToList(), [Lazer, Alimentacao], budgets ?? [], goal, hours,
            MonthStart, now ?? Now, dayStart ?? Today, TestRules.Default));

    [Fact]
    public void The_daily_allowance_splits_what_is_free_after_bills_and_the_goal_across_the_days_left()
    {
        var transactions = new List<Transaction> { Salary(8), Salary(9), Tx("Empresa Acme Ltda", 528000, Day(10, 5), Salario) };
        transactions.Add(Tx("Mercado", 100000, Day(10, 10), Alimentacao));
        transactions.Add(Tx("Cinema", 3000, Day(10, 21, 15)));

        var result = Daily(transactions, goal: 200000);

        Assert.True(result.IsCurrentMonth);
        Assert.Equal(11, result.DaysLeft);
        Assert.Equal(3000, result.SpentTodayCents);
        Assert.Equal(528000 - 103000 - 200000, result.FreeToSpendCents);
        Assert.Equal((result.FreeToSpendCents + 3000) / 11, result.TodayAllowanceCents);
        Assert.Equal(result.TodayAllowanceCents - 3000, result.LeftTodayCents);
        Assert.Equal(200000, result.MonthlyGoalCents);
        Assert.Equal(528000 / 176, result.HourValueCents);
        Assert.Equal(176, result.WorkHoursPerMonth);
    }

    [Fact]
    public void Fixed_bills_paid_today_do_not_eat_the_daily_allowance()
    {
        var transactions = new List<Transaction>();
        foreach (var month in new[] { 7, 8, 9 }) transactions.Add(Tx("Claro Internet", 12000, Day(month, 21)));
        transactions.Add(Tx("Claro Internet", 12000, Day(10, 21, 10)));

        Assert.Equal(0, Daily(transactions).SpentTodayCents);
    }

    [Fact]
    public void Spending_more_than_what_comes_in_leaves_nothing_for_today()
    {
        var result = Daily([Tx("Mercado", 50000, Day(10, 3), Alimentacao)], goal: 10000);

        Assert.Equal(-60000, result.FreeToSpendCents);
        Assert.Equal(0, result.TodayAllowanceCents);
        Assert.Equal(0, result.LeftTodayCents);
    }

    [Fact]
    public void Budgets_warn_at_eighty_percent_and_when_exceeded()
    {
        var transactions = new[]
        {
            Tx("Cinema", 45000, Day(10, 2)),
            Tx("Mercado", 85000, Day(10, 3), Alimentacao),
            Tx("Cinema velho", 99999, Day(9, 2)),
        };

        var result = Daily(transactions, budgets: new() { [Lazer.Id] = 40000, [Alimentacao.Id] = 100000, [Guid.NewGuid()] = 1000 });

        Assert.Collection(result.Budgets,
            b =>
            {
                Assert.Equal("Lazer", b.CategoryName);
                Assert.Equal(BudgetLevel.EXCEEDED, b.Level);
                Assert.Equal(1.125, b.Percent);
                Assert.Equal(0, b.PerDayLeftCents);
                Assert.Equal("#123", b.Color);
            },
            b =>
            {
                Assert.Equal(BudgetLevel.WARNING, b.Level);
                Assert.Equal(85000, b.SpentCents);
                Assert.Equal(15000 / 11, b.PerDayLeftCents);
            });
        Assert.Equal(BudgetLevel.OK, Daily([], budgets: new() { [Lazer.Id] = 40000 }).Budgets.Single().Level);
    }

    [Fact]
    public void A_closed_month_keeps_the_budget_status_but_has_no_allowance()
    {
        var result = Daily([Tx("Cinema", 45000, Day(10, 2))], budgets: new() { [Lazer.Id] = 40000 },
            now: new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Utc), dayStart: new DateTime(2026, 11, 2, 0, 0, 0, DateTimeKind.Utc));

        Assert.False(result.IsCurrentMonth);
        Assert.Equal(0, result.DaysLeft);
        Assert.Equal(0, result.TodayAllowanceCents);
        Assert.Equal(BudgetLevel.EXCEEDED, result.Budgets.Single().Level);
        Assert.Equal(0, result.Budgets.Single().PerDayLeftCents);
    }

    [Fact]
    public void The_hour_value_is_the_usual_monthly_income_over_the_hours_worked()
    {
        var transactions = new[] { Salary(7), Salary(8), Tx("Empresa Acme Ltda", 100000, Day(9, 25), Salario), Tx("Pagamento recebido", 999999, Day(9, 1), Salario) };

        Assert.Equal(528000 / 160, WorkValue.HourCents(transactions, MonthStart, 160, TestRules.Default));
        Assert.Equal(0, WorkValue.HourCents([], MonthStart, 160, TestRules.Default));
        Assert.Equal(0, WorkValue.HourCents(transactions, MonthStart, 0, TestRules.Default));
        Assert.Equal(WorkValue.DefaultHoursPerMonth, WorkValue.Hours(null));
        Assert.Equal(120, WorkValue.Hours(new SavingsPlan { WorkHoursPerMonth = 120 }));
    }

    [Fact]
    public void Fees_and_interest_are_summed_by_kind_for_the_month_and_the_last_twelve_months()
    {
        var transactions = new[]
        {
            Tx("Tarifa de manutenção de conta", 3990, Day(10, 5)),
            Tx("Tarifa de manutenção de conta", 3990, Day(9, 5)),
            Tx("Anuidade cartão", 4500, Day(8, 5)),
            Tx("IOF sobre compra internacional", 380, Day(10, 7)),
            Tx("Juros do rotativo", 15000, Day(10, 8)),
            Tx("Multa por atraso", 2000, Day(6, 8)),
            Tx("Tarifa antiga", 9999, new DateTime(2025, 10, 1, 12, 0, 0, DateTimeKind.Utc)),
            Tx("Mercado", 50000, Day(10, 5)),
        };

        var fees = FeeAnalyzer.Analyze(transactions, MonthStart, Now, TestRules.Default);

        Assert.Equal(3990 + 380 + 15000, fees.MonthCents);
        Assert.Equal(3990 * 2 + 4500 + 380 + 15000 + 2000, fees.YearCents);
        Assert.Equal(["Juros e encargos", "Tarifas bancárias", "Anuidade do cartão", "Multas", "IOF"], fees.Items.Select(i => i.Label));
        var tarifas = fees.Items.Single(i => i.Label == "Tarifas bancárias");
        Assert.Equal(2, tarifas.Count);
        Assert.Equal(Day(10, 5), tarifas.LastDate);
        Assert.Equal(fees.MonthCents, AvoidableSpendingAnalyzer.Analyze(transactions, MonthStart, Now, TestRules.Default, 12m).Fees.MonthCents);
    }

    private static Challenge NewChallenge(ChallengeScope scope, Guid? target = null, long limit = 0, int days = 10) => new()
    {
        UserId = Me, Name = "Sem delivery", Scope = scope, TargetId = target, LimitCents = limit,
        StartsOn = new DateTime(2026, 10, 15, 3, 0, 0, DateTimeKind.Utc), Days = days,
    };

    [Fact]
    public void A_challenge_counts_only_its_scope_and_estimates_the_savings_against_the_usual_rhythm()
    {
        var challenge = NewChallenge(ChallengeScope.CATEGORY, Lazer.Id, limit: 5000);
        var transactions = new[]
        {
            Tx("Cinema", 90000, Day(8, 1)),
            Tx("Cinema", 2000, Day(10, 16)),
            Tx("Mercado", 40000, Day(10, 17), Alimentacao),
            Tx("Cinema muito antigo", 50000, Day(6, 1)),
        };

        var result = ChallengeTracker.Track(challenge, transactions, Now, "Lazer", TestRules.Default);

        Assert.Equal(ChallengeStatus.ACTIVE, result.Status);
        Assert.Equal(7, result.DaysElapsed);
        Assert.Equal(2000, result.SpentCents);
        Assert.Equal(90000 * 7 / 90, result.BaselineCents);
        Assert.Equal(result.BaselineCents - 2000, result.SavedCents);
        Assert.Equal(challenge.StartsOn.AddDays(10), result.EndsOn);
        Assert.Equal("Lazer", result.TargetName);
    }

    [Fact]
    public void Breaking_the_limit_loses_the_challenge_and_finishing_within_it_wins()
    {
        var restaurant = new Merchant { Id = Guid.NewGuid(), UserId = Me, Name = "Toru", Key = "toru" };

        var lost = ChallengeTracker.Track(NewChallenge(ChallengeScope.MERCHANT, restaurant.Id),
            [Tx("Toru", 3000, Day(10, 16), merchant: restaurant)], Now, "Toru", TestRules.Default);
        var won = ChallengeTracker.Track(NewChallenge(ChallengeScope.MERCHANT, restaurant.Id, days: 3),
            [Tx("Toru", 3000, Day(10, 19), merchant: restaurant)], Now, "Toru", TestRules.Default);

        Assert.Equal(ChallengeStatus.LOST, lost.Status);
        Assert.Equal(0, lost.SavedCents);
        Assert.Equal(ChallengeStatus.WON, won.Status);
        Assert.Equal(3, won.DaysElapsed);
        Assert.Equal(0, won.SpentCents);
    }

    [Fact]
    public void A_superfluous_challenge_follows_the_spending_class_and_a_future_one_has_not_started()
    {
        var transactions = new[] { Tx("Ifd*Pizzaria", 4000, Day(10, 16)), Tx("Mercado", 40000, Day(10, 16), Alimentacao) };

        var result = ChallengeTracker.Track(NewChallenge(ChallengeScope.SUPERFLUOUS, limit: 10000), transactions, Now, "Gastos supérfluos", TestRules.Default);
        var future = ChallengeTracker.Track(NewChallenge(ChallengeScope.SUPERFLUOUS), transactions, Day(10, 10), "", TestRules.Default);

        Assert.Equal(4000, result.SpentCents);
        Assert.Equal(ChallengeStatus.ACTIVE, result.Status);
        Assert.Equal(0, future.DaysElapsed);
        Assert.Equal(0, future.SpentCents);
    }
}

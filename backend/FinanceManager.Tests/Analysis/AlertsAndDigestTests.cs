using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class AlertsAndDigestTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 20, 15, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = Cat("Lazer", CategoryType.EXPENSE);
    private static readonly Category Moradia = Cat("Moradia", CategoryType.EXPENSE);
    private static readonly Category Salario = Cat("Salário", CategoryType.INCOME);

    private static Category Cat(string name, CategoryType type) => new() { UserId = Me, Name = name, Type = type, Color = "#000" };

    private static DateTime Day(int month, int day, int hour = 15) => new(2026, month, day, hour, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(string description, long cents, DateTime date, Category? category = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = Me,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = category ?? Lazer,
        CategoryId = (category ?? Lazer).Id,
        Description = description,
        AmountCents = cents,
        Type = (category ?? Lazer).Type == CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE,
        Date = date,
    };

    private static AvoidableSpendingDto Analyze(IEnumerable<Transaction> transactions, AvoidableContext? context = null) =>
        AvoidableSpendingAnalyzer.Analyze(transactions.ToList(), MonthStart, Now, TestRules.Default, 12m, context);

    private static AvoidableContext Context(IEnumerable<string>? dismissed = null, IEnumerable<SubscriptionDecision>? decisions = null, decimal inflation = 4m) =>
        new((dismissed ?? []).ToHashSet(), (decisions ?? []).ToDictionary(d => d.MerchantKey), inflation);

    [Fact]
    public void The_same_charge_twice_within_three_days_is_flagged_unless_refunded_dismissed_or_small()
    {
        var first = Tx("Loja Eletro", 25000, Day(10, 5));
        var second = Tx("Loja Eletro", 25000, Day(10, 7));
        var refundedA = Tx("Posto Shell", 18000, Day(10, 8));
        var refundedB = Tx("Posto Shell", 18000, Day(10, 9));
        var refund = Tx("Posto Shell", 18000, Day(10, 12), Salario);
        var smallA = Tx("Padaria", 1200, Day(10, 10));
        var smallB = Tx("Padaria", 1200, Day(10, 10, 18));
        var far = Tx("Mercado Bom", 9000, Day(10, 1));
        var farLater = Tx("Mercado Bom", 9000, Day(10, 15));
        var dismissedA = Tx("Farmácia Sul", 4000, Day(10, 11));
        var dismissedB = Tx("Farmácia Sul", 4000, Day(10, 12));
        var installmentA = Tx("Sofá - Parcela 2/5", 30000, Day(10, 2));
        var installmentB = Tx("Sofá - Parcela 3/5", 30000, Day(10, 3));
        var lastMonth = Tx("Livraria", 5000, Day(9, 28));
        var thisMonth = Tx("Livraria", 5000, Day(10, 1, 12));

        var result = Analyze(
            [first, second, refundedA, refundedB, refund, smallA, smallB, far, farLater, dismissedA, dismissedB, installmentA, installmentB, lastMonth, thisMonth],
            Context(dismissed: [DuplicateChargeDetector.KeyPrefix + dismissedB.Id]));

        Assert.Collection(result.Duplicates,
            d =>
            {
                Assert.Equal("Loja Eletro", d.Name);
                Assert.Equal(second.Id, d.TransactionId);
                Assert.Equal(DuplicateChargeDetector.KeyPrefix + second.Id, d.Key);
                Assert.Equal(first.Date, d.FirstDate);
                Assert.Equal(25000, d.AmountCents);
            },
            d => Assert.Equal(thisMonth.Id, d.TransactionId));
    }

    [Fact]
    public void Bills_that_rose_above_inflation_are_listed_and_can_be_dismissed()
    {
        var transactions = new List<Transaction>();
        foreach (var month in new[] { 6, 7, 8, 9 })
        {
            transactions.Add(Tx("Claro Internet", 10000, Day(month, 10), Moradia));
            transactions.Add(Tx("Enel Energia", 20000, Day(month, 12), Moradia));
            transactions.Add(Tx("Netflix", 3990, Day(month, 3)));
        }
        transactions.Add(Tx("Claro Internet", 12500, Day(10, 10), Moradia));
        transactions.Add(Tx("Enel Energia", 20500, Day(10, 12), Moradia));
        transactions.Add(Tx("Netflix", 5590, Day(10, 3)));
        transactions.Add(Tx("Sabesp Agua", 9000, Day(10, 5), Moradia));
        transactions.Add(Tx("Sabesp Agua", 6000, Day(9, 5), Moradia));

        var increase = Assert.Single(Analyze(transactions, Context()).BillIncreases);

        Assert.Equal(transactions[^5].MerchantName(TestRules.Default), increase.Name);
        Assert.Equal(10000, increase.PreviousCents);
        Assert.Equal(12500, increase.CurrentCents);
        Assert.Equal(25, increase.IncreasePercent);
        Assert.Equal(2500 * 12, increase.YearlyImpactCents);
        Assert.Equal($"{BillIncreaseDetector.KeyPrefix}{transactions[^5].MerchantKey(TestRules.Default)}:2026-10", increase.Key);
        Assert.Empty(Analyze(transactions, Context(dismissed: [increase.Key])).BillIncreases);
        Assert.Empty(Analyze(transactions, Context(inflation: 30m)).BillIncreases);
        Assert.Equal(4m, Analyze(transactions, Context()).InflationPercent);
    }

    [Fact]
    public void Monthly_marked_expenses_count_as_bills_and_need_two_previous_charges()
    {
        var cleaner = new[] { Tx("Diarista Joana", 9000, Day(8, 1)), Tx("Diarista Joana", 9000, Day(9, 1)), Tx("Diarista Joana", 12000, Day(10, 1, 12)) };
        var single = new[] { Tx("Condominio Sol", 50000, Day(9, 1), Moradia), Tx("Condominio Sol", 80000, Day(10, 1, 12), Moradia) };
        var free = new[] { Tx("Lavanderia Zero", 0, Day(8, 1)), Tx("Lavanderia Zero", 0, Day(9, 1)), Tx("Lavanderia Zero", 900, Day(10, 2)) };
        foreach (var t in cleaner.Concat(free)) t.Recurrence = Recurrence.MONTHLY;

        var result = Analyze([.. cleaner, .. single, .. free], Context());

        Assert.Equal(12000, Assert.Single(result.BillIncreases).CurrentCents);
    }

    [Fact]
    public void Subscription_choices_show_up_and_a_charge_after_cancelling_is_flagged()
    {
        var transactions = new[]
        {
            Tx("Netflix", 3990, Day(9, 3)), Tx("Netflix", 3990, Day(10, 3)),
            Tx("Spotify", 2190, Day(9, 8)), Tx("Spotify", 2190, Day(10, 8)),
            Tx("Disney Plus", 3390, Day(10, 9)),
        };
        string KeyOf(int i) => transactions[i].MerchantKey(TestRules.Default);
        var decisions = new[]
        {
            new SubscriptionDecision { UserId = Me, MerchantKey = KeyOf(0), Name = "Netflix", Choice = SubscriptionChoice.CANCEL, DecidedAt = Day(9, 20) },
            new SubscriptionDecision { UserId = Me, MerchantKey = KeyOf(2), Name = "Spotify", Choice = SubscriptionChoice.KEEP, DecidedAt = Day(9, 20) },
            new SubscriptionDecision { UserId = Me, MerchantKey = KeyOf(4), Name = "Disney Plus", Choice = SubscriptionChoice.CANCEL, DecidedAt = Day(10, 15) },
        };

        var subscriptions = Analyze(transactions, Context(decisions: decisions)).Subscriptions;

        var netflix = subscriptions.Single(s => s.Key == KeyOf(0));
        Assert.Equal(SubscriptionChoice.CANCEL, netflix.Choice);
        Assert.True(netflix.ChargedAfterCancel);
        Assert.Equal(Day(9, 20), netflix.DecidedAt);
        Assert.False(subscriptions.Single(s => s.Key == KeyOf(2)).ChargedAfterCancel);
        Assert.Equal(SubscriptionChoice.KEEP, subscriptions.Single(s => s.Key == KeyOf(2)).Choice);
        Assert.False(subscriptions.Single(s => s.Key == KeyOf(4)).ChargedAfterCancel);
        Assert.Null(Analyze(transactions).Subscriptions.First().Choice);
    }

    private static DigestDto Digest(IEnumerable<Transaction> transactions, IEnumerable<Goal>? goals = null) =>
        DigestAnalyzer.Build(transactions.ToList(), (goals ?? []).ToList(), MonthStart, Now, new DateTime(2026, 10, 20, 3, 0, 0, DateTimeKind.Utc), TestRules.Default);

    [Fact]
    public void The_digest_compares_the_week_and_the_month_with_the_period_before()
    {
        var transactions = new[]
        {
            Tx("Ifd*Pizzaria", 6000, Day(10, 18)),
            Tx("Mercado Bom", 20000, Day(10, 16)),
            Tx("Ifd*Pizzaria", 2000, Day(10, 10)),
            Tx("Mercado Bom", 30000, Day(10, 9)),
            Tx("Empresa Acme", 500000, Day(10, 5), Salario),
            Tx("Mercado Bom", 40000, Day(9, 10)),
            Tx("Pagamento de fatura", 99999, Day(10, 17)),
        };

        var digest = Digest(transactions);

        Assert.Equal(26000, digest.Week.SpentCents);
        Assert.Equal(32000, digest.Week.PreviousSpentCents);
        Assert.Equal(-18.8, digest.Week.ChangePercent);
        Assert.Equal(6000, digest.Week.SuperfluousCents);
        Assert.Equal("Mercado Bom", digest.Week.TopMerchant!.Name);
        Assert.Equal(6000, digest.Week.TopIncrease.Cents);
        Assert.Equal(2000, digest.Week.TopIncrease.PreviousCents);

        Assert.Equal(58000, digest.Month.SpentCents);
        Assert.Equal(40000, digest.Month.PreviousSpentCents);
        Assert.Equal(45, digest.Month.ChangePercent);
        Assert.Equal(500000, digest.Month.IncomeCents);
        Assert.Equal(442000, digest.Month.SavedCents);
        Assert.Equal(MonthStart, digest.Month.Start);
    }

    [Fact]
    public void An_empty_period_has_no_change_or_highlights_and_goals_show_their_progress()
    {
        var goals = new[]
        {
            new Goal { UserId = Me, Name = "Viagem", TargetCents = 100000, CurrentCents = 25000 },
            new Goal { UserId = Me, Name = "Carro", TargetCents = 50000, CurrentCents = 60000 },
            new Goal { UserId = Me, Name = "Concluída", TargetCents = 1000, CurrentCents = 1000, Status = GoalStatus.COMPLETED },
            new Goal { UserId = Me, Name = "Sem alvo", TargetCents = 0 },
        };

        var digest = Digest([], goals);

        Assert.Null(digest.Week.ChangePercent);
        Assert.Null(digest.Week.TopMerchant);
        Assert.Null(digest.Week.TopIncrease);
        Assert.Collection(digest.Goals,
            g => { Assert.Equal("Carro", g.Name); Assert.Equal(100, g.Percent); Assert.Equal(0, g.MissingCents); },
            g => { Assert.Equal(25, g.Percent); Assert.Equal(75000, g.MissingCents); });
    }
}

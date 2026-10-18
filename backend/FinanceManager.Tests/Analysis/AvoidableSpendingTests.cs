using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class AvoidableSpendingTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 20, 15, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = Cat("Lazer");
    private static readonly Category Alimentacao = Cat("Alimentação");
    private static readonly Category Moradia = Cat("Moradia");

    private static Category Cat(string name) => new() { UserId = Me, Name = name, Type = CategoryType.EXPENSE, Color = "#000" };

    private static DateTime Day(int month, int day) => new(2026, month, day, 15, 0, 0, DateTimeKind.Utc);

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
        Type = TransactionType.EXPENSE,
        Date = date,
    };

    private static AvoidableSpendingDto Analyze(IEnumerable<Transaction> transactions, decimal cdi = 12m) =>
        AvoidableSpendingAnalyzer.Analyze(transactions.ToList(), MonthStart, Now, TestRules.Default, cdi);

    [Fact]
    public void The_month_total_is_the_superfluous_spending_and_the_year_projection_uses_the_average()
    {
        var result = Analyze(
        [
            Tx("Cinema", 10000, Day(7, 10)), Tx("Cinema", 20000, Day(8, 10)), Tx("Cinema", 30000, Day(9, 10)),
            Tx("Ifd*Pizzaria", 8000, Day(10, 5)), Tx("Aluguel", 150000, Day(10, 5), Moradia),
        ]);

        Assert.Equal(8000, result.MonthCents);
        Assert.Equal(20000, result.MonthlyAverageCents);
        Assert.Equal(240000, result.YearProjectionCents);
        Assert.Equal(3, result.HistoryMonths);
        Assert.Equal(12m, result.CdiAnnualPercent);
        Assert.True(result.InvestedIn12MonthsCents > 240000);
    }

    [Fact]
    public void Without_history_the_month_itself_is_the_average()
    {
        var result = Analyze([Tx("Ifd*Pizzaria", 8000, Day(10, 5))]);

        Assert.Equal(0, result.HistoryMonths);
        Assert.Equal(8000, result.MonthlyAverageCents);
        Assert.Empty(result.Spikes);
    }

    [Fact]
    public void Investing_monthly_at_the_cdi_compounds_and_a_zero_rate_is_plain_sum()
    {
        Assert.Equal(12000, AvoidableSpendingAnalyzer.Invested(1000, 0));
        var rate = AvoidableSpendingAnalyzer.MonthlyRate(12m);
        Assert.Equal(0.00949, rate, 4);
        Assert.Equal(12646, AvoidableSpendingAnalyzer.Invested(1000, rate));
    }

    [Fact]
    public void Superfluous_merchants_show_the_half_cut_and_what_it_would_become()
    {
        var result = Analyze(
        [
            Tx("Ifd*Pizzaria", 4000, Day(9, 2)), Tx("Ifd*Pizzaria", 6000, Day(10, 3)), Tx("Ifd*Lanches", 4000, Day(10, 9)),
            Tx("Cinema", 5000, Day(10, 12)),
        ]);

        var ifood = result.Superfluous[0];
        Assert.Equal("iFood", ifood.Name);
        Assert.Equal(2, ifood.Count);
        Assert.Equal(10000, ifood.MonthCents);
        Assert.Equal(4000, ifood.MonthlyAverageCents);
        Assert.Equal(5000, ifood.CutCents);
        Assert.True(ifood.CutInvestedIn12MonthsCents > 60000);
        Assert.Equal(["iFood", "Cinema"], result.Superfluous.Select(m => m.Name));
    }

    [Fact]
    public void A_merchant_marked_by_the_user_overrides_the_rules()
    {
        var padaria = new Merchant { UserId = Me, Name = "Padaria Central", Key = "padariacentral", Class = SpendingClass.SUPERFLUOUS };
        var netflix = new Merchant { UserId = Me, Name = "Netflix", Key = "netflix", Class = SpendingClass.ESSENTIAL };

        var result = Analyze([Tx("Padaria Central", 2500, Day(10, 3), Alimentacao, padaria), Tx("Netflix", 5590, Day(10, 4), merchant: netflix)]);

        Assert.Equal(2500, result.MonthCents);
        Assert.Equal(["Padaria Central"], result.Superfluous.Select(m => m.Name));
    }

    [Fact]
    public void Subscriptions_flag_price_increases_resumed_charges_and_similar_services()
    {
        var result = Analyze(
        [
            Tx("Netflix.com", 3990, Day(6, 5)), Tx("Netflix.com", 3990, Day(7, 5)), Tx("Netflix.com", 4490, Day(10, 5)),
            Tx("Disney Plus", 2790, Day(9, 8)), Tx("Disney Plus", 2790, Day(10, 8)),
            Tx("Spotify", 2190, Day(4, 1)),
        ]);

        var netflix = Assert.Single(result.Subscriptions, s => s.Name == "Netflix");
        Assert.True(netflix.PriceIncreased);
        Assert.Equal(3990, netflix.PreviousCents);
        Assert.Equal(4490, netflix.MonthlyCents);
        Assert.Equal(53880, netflix.YearlyCents);
        Assert.Equal(Day(7, 5), netflix.ResumedAfter);
        Assert.Equal("Streaming de vídeo", netflix.Group);
        var disney = Assert.Single(result.Subscriptions, s => s.Name == "Disney+");
        Assert.False(disney.PriceIncreased);
        Assert.Null(disney.ResumedAfter);
        Assert.Null(disney.PreviousCents);
        Assert.DoesNotContain(result.Subscriptions, s => s.Name == "Spotify");
        var similar = Assert.Single(result.SimilarSubscriptions);
        Assert.Equal("Streaming de vídeo", similar.Group);
        Assert.Equal(["Netflix", "Disney+"], similar.Names);
        Assert.Equal(4490 + 2790, similar.MonthlyCents);
    }

    [Fact]
    public void Small_frequent_purchases_add_up_and_essentials_or_rare_ones_are_left_out()
    {
        var padaria = Enumerable.Range(1, 15).SelectMany(d => new[] { Tx("Padaria Pão Bom", 1200, Day(9, d), Alimentacao) });
        var rare = new[] { Tx("Lanchonete X", 1500, Day(9, 3)), Tx("Lanchonete X", 1500, Day(9, 20)) };
        var bills = Enumerable.Range(1, 10).Select(d => Tx("Conta de água", 2000, Day(9, d), Moradia));

        var result = Analyze([.. padaria, .. rare, .. bills, Tx("Padaria Pão Bom", 9000, Day(9, 28), Alimentacao)]);

        var merchant = Assert.Single(result.SmallPurchases.Merchants);
        Assert.Equal("Padaria Pão Bom", merchant.Name);
        Assert.Equal(18000, merchant.MonthlyCents);
        Assert.Equal(15, merchant.TimesPerMonth);
        Assert.Equal(1200, merchant.AverageTicketCents);
        Assert.Equal(18000, result.SmallPurchases.MonthlyCents);
        Assert.Equal(15, result.SmallPurchases.TimesPerMonth);
        Assert.Equal(AvoidableSpendingAnalyzer.SmallPurchaseCents, result.SmallPurchases.LimitCents);
    }

    [Fact]
    public void Spikes_flag_merchants_and_categories_well_above_their_average()
    {
        var result = Analyze(
        [
            Tx("Cinema", 10000, Day(9, 10)), Tx("Cinema", 30000, Day(10, 10)),
            Tx("Bar do Zé", 10000, Day(9, 11)), Tx("Bar do Zé", 12000, Day(10, 11)),
            Tx("Aluguel", 100000, Day(9, 5), Moradia), Tx("Aluguel", 300000, Day(10, 5), Moradia),
        ]);

        var lazer = Assert.Single(result.Spikes, s => s.Kind == SpikeKind.CATEGORY);
        Assert.Equal("Lazer", lazer.Name);
        Assert.Equal(42000, lazer.MonthCents);
        Assert.Equal(20000, lazer.AverageCents);
        Assert.Equal(2.1, lazer.Ratio);
        var cinema = Assert.Single(result.Spikes, s => s.Kind == SpikeKind.MERCHANT);
        Assert.Equal("Cinema", cinema.Name);
        Assert.DoesNotContain(result.Spikes, s => s.Name == "Aluguel" || s.Name == "Moradia");
    }

    [Fact]
    public void Big_first_time_purchases_are_listed_but_known_places_and_small_ones_are_not()
    {
        var result = Analyze(
        [
            Tx("Loja de Eletrônicos Nova", 250000, Day(10, 2), Alimentacao),
            Tx("Shopee", 30000, Day(5, 2)), Tx("Shopee", 30000, Day(10, 2)),
            Tx("Presente Bonito", 5000, Day(10, 3)),
            Tx("Clínica Odonto", 80000, Day(10, 4), Moradia),
        ]);

        var purchase = Assert.Single(result.FirstTimePurchases);
        Assert.Equal("Loja de Eletrônicos Nova", purchase.Name);
        Assert.Equal(250000, purchase.Cents);
        Assert.Equal(Day(10, 2), purchase.Date);
        Assert.Equal(SpendingClass.VARIABLE, purchase.Class);
    }

    [Fact]
    public void Income_own_money_and_future_entries_are_ignored()
    {
        var income = Tx("Salário", 900000, Day(10, 5));
        income.Type = TransactionType.INCOME;

        var result = Analyze([income, Tx("Aplicação RDB", 50000, Day(10, 6)), Tx("Cinema", 5000, Day(10, 30))]);

        Assert.Equal(0, result.MonthCents);
        Assert.Empty(result.Superfluous);
    }
}

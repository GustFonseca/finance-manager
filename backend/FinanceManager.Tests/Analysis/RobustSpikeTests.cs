using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class RobustSpikeTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 20, 15, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = new() { UserId = Me, Name = "Lazer", Type = CategoryType.EXPENSE, Color = "#000" };

    private static DateTime Day(int month, int day) => new(2026, month, day, 15, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(string description, long cents, DateTime date, Merchant? merchant = null) => new()
    {
        UserId = Me,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = Lazer,
        CategoryId = Lazer.Id,
        Merchant = merchant,
        MerchantId = merchant?.Id,
        Description = description,
        AmountCents = cents,
        Type = TransactionType.EXPENSE,
        Date = date,
    };

    private static List<SpendingSpikeDto> Spikes(IEnumerable<Transaction> transactions) =>
        AvoidableSpendingAnalyzer.Analyze(transactions.ToList(), MonthStart, Now, TestRules.Default, 12m).Spikes;

    [Fact]
    public void A_place_that_always_varies_a_lot_needs_a_bigger_jump_to_count_as_a_spike()
    {
        var history = new[] { 20000L, 60000, 25000, 70000, 30000, 65000 }
            .Select((cents, i) => Tx("Cinema", cents, Day(4 + i, 10)));

        Assert.Empty(Spikes(history.Append(Tx("Cinema", 90000, Day(10, 10)))));

        var spike = Assert.Single(Spikes(history.Append(Tx("Cinema", 200000, Day(10, 10)))), s => s.Kind == SpikeKind.MERCHANT);
        Assert.Equal(45000, spike.AverageCents);
        Assert.True(spike.ThresholdCents > 90000);
        Assert.Equal(4.4, spike.Ratio);
    }

    [Fact]
    public void A_steady_place_is_flagged_once_it_leaves_its_usual_range()
    {
        var history = Enumerable.Range(4, 6).Select(m => Tx("Bar do Zé", 10000, Day(m, 10)));

        var spike = Assert.Single(Spikes(history.Append(Tx("Bar do Zé", 16000, Day(10, 10)))), s => s.Kind == SpikeKind.MERCHANT);

        Assert.Equal(15000, spike.ThresholdCents);
    }

    [Fact]
    public void Months_without_spending_at_a_place_count_as_zero()
    {
        var transactions = Enumerable.Range(4, 6).Select(m => Tx("Mercado", 1000, Day(m, 1)))
            .Append(Tx("Show", 30000, Day(5, 2)))
            .Append(Tx("Show", 30000, Day(10, 2)));

        var spike = Assert.Single(Spikes(transactions), s => s.Name == "Show");

        Assert.Equal(5000, spike.AverageCents);
    }

    [Theory]
    [InlineData(new long[] { }, 0)]
    [InlineData(new long[] { 5 }, 5)]
    [InlineData(new long[] { 9, 1, 5 }, 5)]
    [InlineData(new long[] { 4, 1, 3, 2 }, 2)]
    public void The_median_is_the_middle_value(long[] values, long median)
    {
        Assert.Equal(median, Stats.Median(values));
    }

    [Fact]
    public void With_few_months_the_threshold_is_the_average_ratio()
    {
        Assert.Equal(15000, AvoidableSpendingAnalyzer.SpikeThreshold([10000, 10000], 10000));
        Assert.Equal(15000, AvoidableSpendingAnalyzer.SpikeThreshold([10000, 10000, 10000], 10000));
        Assert.Equal(10000 + (long)Math.Ceiling(3 * 1.4826 * 5000), AvoidableSpendingAnalyzer.SpikeThreshold([5000, 10000, 20000], 11666));
    }

    [Fact]
    public void The_economic_activity_of_the_merchant_drives_its_class()
    {
        var restaurant = new Merchant { UserId = Me, Name = "Jl Comercio", Key = "jlcomercio", Activity = "Restaurantes e similares" };
        var gas = new Merchant { UserId = Me, Name = "Posto Ab", Key = "postoab", Activity = "Comércio varejista de combustíveis para veículos automotores" };
        var other = new Category { UserId = Me, Name = "Outros", Type = CategoryType.EXPENSE, Color = "#000" };

        Assert.Equal(SpendingClass.SUPERFLUOUS, SpendingClassifier.Classify(new Transaction { Description = "Compra", Merchant = restaurant, Category = other }, TestRules.Default));
        Assert.Equal(SpendingClass.VARIABLE, SpendingClassifier.Classify(new Transaction { Description = "Compra", Merchant = gas, Category = other }, TestRules.Default));
        Assert.Equal(SpendingClass.ESSENTIAL, SpendingClassifier.Classify("Cia Luz Distribuição de energia elétrica", "Outros", TestRules.Default));
        Assert.Equal("Alimentação", TestRules.Default.CategoryHint("Restaurantes e similares"));
        Assert.Equal("Saúde", TestRules.Default.CategoryHint("Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas"));
        Assert.Equal("Moradia", TestRules.Default.CategoryHint("Distribuição de energia elétrica"));
    }

    [Theory]
    [InlineData("12.345.678/0001-90", "12345678000190")]
    [InlineData("•••.123.456-••", null)]
    [InlineData(null, null)]
    public void Only_full_cnpjs_are_looked_up(string? document, string? digits)
    {
        Assert.Equal(digits, Cnpj.Digits(document));
    }
}

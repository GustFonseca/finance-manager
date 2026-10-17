using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Spending;

public class SpendingAnalysisTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);

    private static readonly Category Moradia = Cat("Moradia");
    private static readonly Category Alimentacao = Cat("Alimentação");
    private static readonly Category Lazer = Cat("Lazer");
    private static readonly Category Outros = Cat("Outros");

    private static Category Cat(string name) => new() { UserId = Me, Name = name, Type = CategoryType.EXPENSE, Color = "#000" };

    private static Transaction Tx(string description, long cents, DateTime date, Category category) => new()
    {
        UserId = Me,
        Category = category,
        CategoryId = category.Id,
        Description = description,
        AmountCents = cents,
        Type = TransactionType.EXPENSE,
        Date = date,
    };

    private static DateTime Day(int month, int day) => new(2026, month, day, 15, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData("IFOOD *Restaurante", "Alimentação", SpendingClass.SUPERFLUOUS)]
    [InlineData("Supermercado Dia", "Alimentação", SpendingClass.VARIABLE)]
    [InlineData("Vivo Fibra", "Outros", SpendingClass.ESSENTIAL)]
    [InlineData("NETFLIX.COM", "Outros", SpendingClass.SUPERFLUOUS)]
    [InlineData("Pix para João", "Moradia", SpendingClass.ESSENTIAL)]
    [InlineData("Loja qualquer", "Lazer", SpendingClass.SUPERFLUOUS)]
    [InlineData("Loja qualquer", "Outros", SpendingClass.VARIABLE)]
    public void Classifies_by_merchant_first_then_by_category(string description, string category, SpendingClass expected)
    {
        Assert.Equal(expected, SpendingClassifier.Classify(description, category));
    }

    /// <summary>July–September habits, then October so far.</summary>
    private static List<Transaction> Data()
    {
        var list = new List<Transaction>();
        foreach (var month in new[] { 7, 8, 9, 10 })
        {
            list.Add(Tx("Aluguel", 150000, Day(month, 10), Moradia));
            list.Add(Tx("Netflix", 5590, Day(month, 6), Lazer));
            for (var i = 0; i < (month == 10 ? 4 : 8); i++) list.Add(Tx("iFood", 5000, Day(month, 1 + i * 3), Alimentacao));
            for (var i = 0; i < (month == 10 ? 2 : 4); i++) list.Add(Tx("Supermercado", 25000, Day(month, 2 + i * 7), Alimentacao));
            list.Add(Tx("Padaria do Zé", 1500, Day(month, 3), Outros));   // too small to suggest
        }
        return list;
    }

    [Fact]
    public void The_month_is_split_by_class_and_category()
    {
        var analysis = SpendingAnalyzer.Analyze(Data(), MonthStart, Now);

        // October: rent 1.500 + Netflix 55,90 + iFood 4×50 + market 2×250 + bakery 15.
        Assert.Equal(150000 + 5590 + 20000 + 50000 + 1500, analysis.MonthExpenseCents);
        Assert.Equal(1, analysis.ByClass.Sum(c => c.Share), 3);
        Assert.Equal(150000, analysis.ByClass.Single(c => c.Class == SpendingClass.ESSENTIAL).Cents);
        Assert.Equal(5590 + 20000, analysis.ByClass.Single(c => c.Class == SpendingClass.SUPERFLUOUS).Cents);

        var food = analysis.ByCategory.Single(c => c.CategoryName == "Alimentação");
        Assert.Equal(70000, food.Cents);
        Assert.Equal(SpendingClass.VARIABLE, food.Class);           // more went to the market than to iFood
        Assert.Equal(140000, food.AverageCents);                    // 8×50 + 4×250 a month before
        Assert.Equal("Moradia", analysis.ByCategory[0].CategoryName);
    }

    [Fact]
    public void The_trend_has_six_months_oldest_first_ending_now()
    {
        var analysis = SpendingAnalyzer.Analyze(Data(), MonthStart, Now);

        Assert.Equal(6, analysis.Months.Count);
        Assert.Equal(MonthStart.AddMonths(-5), analysis.Months[0].MonthStart);
        Assert.Equal(MonthStart, analysis.Months[^1].MonthStart);
        Assert.Equal(0, analysis.Months[0].EssentialCents);          // May: no data
        Assert.Equal(40000 + 5590, analysis.Months[^2].SuperfluousCents);
    }

    [Fact]
    public void Top_merchants_group_every_purchase_of_the_month()
    {
        var analysis = SpendingAnalyzer.Analyze(Data(), MonthStart, Now);

        var ifood = analysis.TopMerchants.Single(m => m.Name == "iFood");
        Assert.Equal(4, ifood.Count);
        Assert.Equal(20000, ifood.Cents);
        Assert.Equal(SpendingClass.SUPERFLUOUS, ifood.Class);
    }

    [Fact]
    public void Habits_are_ranked_by_what_cutting_them_saves()
    {
        var analysis = SpendingAnalyzer.Analyze(Data(), MonthStart, Now);
        var byName = analysis.Reducible.ToDictionary(r => r.Name);

        Assert.Equal(20000, byName["iFood"].PotentialCents);         // half of 8×50 a month
        Assert.Equal(8, byName["iFood"].TimesPerMonth);
        Assert.Contains("8 vezes por mês", byName["iFood"].Detail);
        Assert.Equal(15000, byName["Supermercado"].PotentialCents);  // 15% of 4×250
        Assert.Equal(5590, byName["Netflix"].PotentialCents);        // a subscription is cancelled, not halved
        Assert.DoesNotContain("Aluguel", byName.Keys);               // essential
        Assert.DoesNotContain("Padaria do Zé", byName.Keys);         // too small
        Assert.Equal("iFood", analysis.Reducible[0].Name);
        Assert.Equal(analysis.Reducible.Sum(r => r.PotentialCents), analysis.ReduciblePotentialCents);
    }
}

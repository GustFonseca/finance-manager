using System.Diagnostics;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class RecurringAndRulesTests
{
    private static readonly DateTime Now = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Guid.NewGuid(), "Nubank");
    private static readonly Category Lazer = new() { Name = "Lazer", Type = CategoryType.EXPENSE };

    private static Transaction Marked(string description, long cents, Recurrence recurrence) => new()
    {
        UserId = Nubank.UserId,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = Lazer,
        CategoryId = Lazer.Id,
        Description = description,
        AmountCents = cents,
        Type = TransactionType.EXPENSE,
        Date = Now.AddDays(-2),
        Recurrence = recurrence,
    };

    [Theory]
    [InlineData(Recurrence.DAILY, 1000, 30000)]
    [InlineData(Recurrence.WEEKLY, 1200, 5200)]
    [InlineData(Recurrence.MONTHLY, 5590, 5590)]
    [InlineData(Recurrence.YEARLY, 120000, 10000)]
    public void A_marked_recurrence_is_converted_to_its_monthly_cost(Recurrence recurrence, long cents, long monthly)
    {
        var recurring = RecurringExpenseDetector.Detect([Marked("Academia do bairro", cents, recurrence)], Now, TestRules.Default);

        var expense = Assert.Single(recurring);
        Assert.Equal(monthly, expense.MonthlyCents);
        Assert.False(expense.Detected);
    }

    [Fact]
    public void A_pattern_that_takes_too_long_counts_as_no_match_instead_of_hanging()
    {
        var rules = new ClassificationRules([new ClassificationRule { Type = RuleType.BRAND, Pattern = "^(a+)+b$", Value = "Lenta" }]);
        var stopwatch = Stopwatch.StartNew();

        var brand = rules.Brand(new string('a', 40));

        Assert.Null(brand);
        Assert.InRange(stopwatch.Elapsed, TimeSpan.Zero, TimeSpan.FromSeconds(10));
    }

    [Fact]
    public void Category_hints_come_from_the_rules()
    {
        Assert.Equal("Transporte", TestRules.Default.CategoryHint("Posto Ipiranga"));
        Assert.Null(TestRules.Default.CategoryHint("algo sem pista"));
        Assert.Null(ClassificationRules.Empty.CategoryHint("Posto Ipiranga"));
    }
}

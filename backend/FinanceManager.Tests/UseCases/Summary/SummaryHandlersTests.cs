using FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Summary;

public class SummaryHandlersTests
{
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly Guid _me;
    private readonly Account _nubank;
    private readonly Account _itau;
    private readonly Category _lazer;
    private readonly Category _alimentacao;
    private readonly Category _salario;

    public SummaryHandlersTests()
    {
        _me = _db.AddUser().Id;
        _nubank = _db.AddAccount(_me, "Nubank");
        _itau = _db.AddAccount(_me, "Itaú");
        _lazer = _db.AddCategory(_me, "Lazer");
        _alimentacao = _db.AddCategory(_me, "Alimentação");
        _salario = _db.AddCategory(_me, "Salário", CategoryType.INCOME);
    }

    private TransactionRepository Transactions => new(_db);

    [Fact]
    public async Task FinancialSummary_totals_income_and_expense_by_category_ignoring_own_money()
    {
        _db.AddTransaction(_nubank, _salario, 500000, MonthStart.AddDays(4), "Salário ACME");
        _db.AddTransaction(_nubank, _lazer, 10000, MonthStart.AddDays(5), "Cinema");
        _db.AddTransaction(_nubank, _alimentacao, 30000, MonthStart.AddDays(6), "Supermercado Dia");
        _db.AddTransaction(_nubank, _alimentacao, 5000, MonthStart.AddDays(7), "Padaria Real");
        _db.AddTransaction(_nubank, _lazer, 99999, MonthStart.AddDays(8), "Pagamento de fatura");

        var summary = await new GetFinancialSummaryHandler(Transactions, TestRules.Provider)
            .Handle(new GetFinancialSummaryQuery(_me, MonthStart, Now));

        Assert.Equal(500000, summary.TotalIncomeCents);
        Assert.Equal(45000, summary.TotalExpenseCents);
        Assert.Equal(455000, summary.BalanceCents);
        Assert.Equal(["Salário", "Alimentação", "Lazer"], summary.ByCategory.Select(c => c.CategoryName));
        var food = summary.ByCategory[1];
        Assert.Equal((_alimentacao.Id, "#123456", 35000L), (food.CategoryId, food.Color, food.TotalCents));
    }

    [Fact]
    public async Task FinancialSummary_can_be_filtered_by_account_and_period()
    {
        _db.AddTransaction(_nubank, _lazer, 10000, MonthStart.AddDays(5), "Cinema");
        _db.AddTransaction(_itau, _lazer, 20000, MonthStart.AddDays(5), "Teatro");
        _db.AddTransaction(_itau, _lazer, 40000, MonthStart.AddDays(-5), "Show");

        var summary = await new GetFinancialSummaryHandler(Transactions, TestRules.Provider)
            .Handle(new GetFinancialSummaryQuery(_me, MonthStart, Now, _itau.Id));

        Assert.Equal(20000, summary.TotalExpenseCents);
        Assert.Equal(0, summary.TotalIncomeCents);
    }

    [Fact]
    public async Task RecurringExpenses_detects_a_monthly_subscription_in_the_lookback_window()
    {
        for (var i = 0; i < 3; i++)
            _db.AddTransaction(_nubank, _lazer, 5590, MonthStart.AddMonths(-i).AddDays(4), "NETFLIX.COM");
        _db.AddTransaction(_itau, _lazer, 5590, MonthStart.AddDays(4), "NETFLIX.COM");

        var recurring = await new GetRecurringExpensesHandler(Transactions, TestRules.Provider)
            .Handle(new GetRecurringExpensesQuery(_me, Now, _nubank.Id));

        var netflix = Assert.Single(recurring);
        Assert.Equal(("Netflix", RecurringKind.SUBSCRIPTION, 5590L), (netflix.Name, netflix.Kind, netflix.MonthlyCents));
        Assert.Equal(_nubank.Id, netflix.AccountId);
    }

    [Fact]
    public async Task SpendingAnalysis_reports_the_month_against_the_previous_months()
    {
        for (var i = 1; i <= 3; i++)
            _db.AddTransaction(_nubank, _alimentacao, 20000, MonthStart.AddMonths(-i).AddDays(2), "Supermercado Dia");
        _db.AddTransaction(_nubank, _alimentacao, 30000, MonthStart.AddDays(2), "Supermercado Dia");
        _db.AddTransaction(_nubank, _alimentacao, 70000, MonthStart.AddMonths(-8), "Supermercado Dia");
        _db.AddTransaction(_itau, _lazer, 80000, MonthStart.AddDays(3), "Cinema");

        var analysis = await new GetSpendingAnalysisHandler(Transactions, TestRules.Provider)
            .Handle(new GetSpendingAnalysisQuery(_me, MonthStart, Now, _nubank.Id));

        Assert.Equal(30000, analysis.MonthExpenseCents);
        Assert.Equal(20000, analysis.AverageExpenseCents);
        Assert.Equal("Alimentação", Assert.Single(analysis.ByCategory).CategoryName);
        Assert.Equal(6, analysis.Months.Count);
    }
}

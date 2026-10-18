using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;
using FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Savings;

public class SavingsHandlersTests
{
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _account;
    private readonly Category _lazer;
    private readonly Category _moradia;
    private readonly Category _salario;

    public SavingsHandlersTests()
    {
        _me = _db.AddUser();
        _account = _db.AddAccount(_me.Id);
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _moradia = _db.AddCategory(_me.Id, "Moradia");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
    }

    private CategoryBudgetRepository Budgets => new(_db);
    private SavingsPlanRepository Plans => new(_db);

    private GetSavingsPlanHandler PlanHandler => new(
        new TransactionRepository(_db), new CategoryRepository(_db), Budgets, Plans, TestRules.Provider);

    private ApplySuggestedBudgetsHandler ApplyHandler => new(
        new TransactionRepository(_db), new CategoryRepository(_db), Budgets, Plans, TestRules.Provider);

    private void SeedHistory()
    {
        for (var i = 1; i <= 3; i++)
        {
            var day = MonthStart.AddMonths(-i).AddDays(4);
            _db.AddTransaction(_account, _salario, 800000, day, "Salário ACME");
            _db.AddTransaction(_account, _moradia, 200000, day, "Aluguel apartamento");
            _db.AddTransaction(_account, _lazer, 60000, day.AddDays(3), "Cinema Shopping");
        }
        _db.AddTransaction(_account, _lazer, 15000, MonthStart.AddDays(5), "Cinema Shopping");
    }

    [Fact]
    public async Task SetSavingsGoal_creates_then_updates_the_plan()
    {
        var handler = new SetSavingsGoalHandler(Plans);

        Assert.Equal(50000, await handler.Handle(new SetSavingsGoalCommand(_me.Id, 50000)));
        Assert.Equal(80000, await handler.Handle(new SetSavingsGoalCommand(_me.Id, 80000)));

        Assert.Equal(80000, Assert.Single(_db.SavingsPlans).MonthlyGoalCents);
    }

    [Fact]
    public async Task SetSavingsGoal_rejects_a_negative_goal()
    {
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new SetSavingsGoalHandler(Plans).Handle(new SetSavingsGoalCommand(_me.Id, -1)));

        Assert.Equal("A meta não pode ser negativa.", error.Message);
        Assert.Empty(_db.SavingsPlans);
    }

    [Fact]
    public async Task SetCategoryBudget_creates_updates_and_clears_the_limit()
    {
        var handler = new SetCategoryBudgetHandler(new CategoryRepository(_db), Budgets);

        Assert.True(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, _lazer.Id, 30000)));
        Assert.Equal(30000, Assert.Single(_db.CategoryBudgets).LimitCents);

        Assert.True(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, _lazer.Id, 25000)));
        Assert.Equal(25000, Assert.Single(_db.CategoryBudgets).LimitCents);

        Assert.True(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, _lazer.Id, 0)));
        Assert.Empty(_db.CategoryBudgets);

        Assert.True(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, _lazer.Id, null)));
        Assert.Empty(_db.CategoryBudgets);
    }

    [Fact]
    public async Task SetCategoryBudget_returns_false_for_missing_or_foreign_categories()
    {
        var foreign = _db.AddCategory(Guid.NewGuid(), "Lazer");
        var handler = new SetCategoryBudgetHandler(new CategoryRepository(_db), Budgets);

        Assert.False(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, Guid.NewGuid(), 100)));
        Assert.False(await handler.Handle(new SetCategoryBudgetCommand(_me.Id, foreign.Id, 100)));
        Assert.Empty(_db.CategoryBudgets);
    }

    [Fact]
    public async Task SetCategoryBudget_rejects_income_categories_and_negative_limits()
    {
        var handler = new SetCategoryBudgetHandler(new CategoryRepository(_db), Budgets);

        var income = await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetCategoryBudgetCommand(_me.Id, _salario.Id, 100)));
        var negative = await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetCategoryBudgetCommand(_me.Id, _lazer.Id, -1)));

        Assert.Equal("Só categorias de despesa têm orçamento.", income.Message);
        Assert.Equal("O limite não pode ser negativo.", negative.Message);
    }

    [Fact]
    public async Task GetSavingsPlan_combines_the_month_the_history_the_goal_and_the_budgets()
    {
        SeedHistory();
        _db.SavingsPlans.Add(new SavingsPlan { UserId = _me.Id, MonthlyGoalCents = 100000 });
        _db.CategoryBudgets.Add(new CategoryBudget { UserId = _me.Id, CategoryId = _lazer.Id, LimitCents = 40000 });
        _db.SaveChanges();

        var plan = await PlanHandler.Handle(new GetSavingsPlanQuery(_me.Id, MonthStart, Now));

        Assert.Equal(100000, plan.MonthlyGoalCents);
        Assert.Equal(3, plan.HistoryMonths);
        Assert.Equal(15000, plan.MonthExpenseCents);
        Assert.Equal(800000 - 260000, plan.AverageSavedCents);
        Assert.Equal(["Moradia", "Lazer"], plan.Budgets.Select(b => b.CategoryName));
        var lazer = plan.Budgets.Single(b => b.CategoryId == _lazer.Id);
        Assert.Equal((40000L, 15000L, 60000L), (lazer.LimitCents!.Value, lazer.SpentCents, lazer.AverageCents));
        Assert.Null(plan.Budgets.Single(b => b.CategoryId == _moradia.Id).LimitCents);
    }

    [Fact]
    public async Task ApplySuggestedBudgets_creates_missing_limits_updates_changed_ones_and_skips_equal_ones()
    {
        SeedHistory();
        var suggested = (await PlanHandler.Handle(new GetSavingsPlanQuery(_me.Id, MonthStart, Now))).Budgets
            .ToDictionary(b => b.CategoryId, b => b.SuggestedLimitCents);
        Assert.All(suggested.Values, v => Assert.True(v > 0));
        _db.CategoryBudgets.Add(new CategoryBudget { UserId = _me.Id, CategoryId = _moradia.Id, LimitCents = suggested[_moradia.Id] });
        _db.SaveChanges();

        var firstRun = await ApplyHandler.Handle(new ApplySuggestedBudgetsCommand(_me.Id, MonthStart, Now));

        Assert.Equal(1, firstRun);
        Assert.Equal(suggested[_lazer.Id], _db.CategoryBudgets.Single(b => b.CategoryId == _lazer.Id).LimitCents);

        var lazerBudget = _db.CategoryBudgets.Single(b => b.CategoryId == _lazer.Id);
        lazerBudget.LimitCents = 1;
        _db.SaveChanges();

        var secondRun = await ApplyHandler.Handle(new ApplySuggestedBudgetsCommand(_me.Id, MonthStart, Now));

        Assert.Equal(1, secondRun);
        Assert.Equal(suggested[_lazer.Id], _db.CategoryBudgets.Single(b => b.CategoryId == _lazer.Id).LimitCents);
        Assert.Equal(2, _db.CategoryBudgets.Count());
    }

    [Fact]
    public async Task ApplySuggestedBudgets_does_nothing_without_history()
    {
        var applied = await ApplyHandler.Handle(new ApplySuggestedBudgetsCommand(_me.Id, MonthStart, Now));

        Assert.Equal(0, applied);
        Assert.Empty(_db.CategoryBudgets);
    }
}

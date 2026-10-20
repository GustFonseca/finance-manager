using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Rates;
using FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetAvoidableSpending;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Merchants;

public class MerchantClassAndAvoidableTests
{
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 20, 15, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Merchant _padaria;

    public MerchantClassAndAvoidableTests()
    {
        _me = _db.AddUser();
        _padaria = new Merchant { UserId = _me.Id, Name = "Padaria Central", Key = "padariacentral", Kind = MerchantKind.BUSINESS };
        _db.Merchants.Add(_padaria);
        _db.SaveChanges();
    }

    private SetMerchantClassHandler ClassHandler => new(new MerchantRepository(_db));

    [Fact]
    public async Task Marking_a_merchant_changes_its_class_and_is_recorded()
    {
        var dto = await ClassHandler.Handle(new SetMerchantClassCommand(_me.Id, _padaria.Id, SpendingClass.SUPERFLUOUS));

        Assert.Equal(SpendingClass.SUPERFLUOUS, dto!.Class);
        Assert.Equal(SpendingClass.SUPERFLUOUS, _db.Merchants.Single().Class);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Estabelecimento Padaria Central classificado como supérfluo");

        await ClassHandler.Handle(new SetMerchantClassCommand(_me.Id, _padaria.Id, null));

        Assert.Null(_db.Merchants.Single().Class);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Estabelecimento Padaria Central classificado como automático");
    }

    [Theory]
    [InlineData(SpendingClass.ESSENTIAL, "essencial")]
    [InlineData(SpendingClass.VARIABLE, "variável")]
    public async Task Every_class_has_a_readable_name_in_the_history(SpendingClass value, string label)
    {
        await ClassHandler.Handle(new SetMerchantClassCommand(_me.Id, _padaria.Id, value));

        Assert.Contains(_db.ActivityLogs, a => a.Description == $"Estabelecimento Padaria Central classificado como {label}");
    }

    [Fact]
    public async Task Someone_elses_or_a_missing_merchant_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => ClassHandler.Handle(new SetMerchantClassCommand(Guid.NewGuid(), _padaria.Id, SpendingClass.ESSENTIAL)));
        await Assert.ThrowsAsync<NotFoundException>(() => ClassHandler.Handle(new SetMerchantClassCommand(_me.Id, Guid.NewGuid(), SpendingClass.ESSENTIAL)));
    }

    [Fact]
    public void The_spending_classifier_honors_the_merchant_class()
    {
        var transaction = new Transaction { Description = "Netflix.com", Merchant = new Merchant { Name = "Netflix", Class = SpendingClass.ESSENTIAL } };

        Assert.Equal(SpendingClass.ESSENTIAL, SpendingClassifier.Classify(transaction, TestRules.Default));
    }

    [Fact]
    public async Task The_avoidable_query_loads_twelve_months_and_uses_the_current_cdi()
    {
        var account = _db.AddAccount(_me.Id);
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        _db.AddTransaction(account, lazer, 5000, new DateTime(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc), "Cinema");
        _db.AddTransaction(account, lazer, 7000, new DateTime(2025, 9, 10, 12, 0, 0, DateTimeKind.Utc), "Cinema antigo");
        var handler = new GetAvoidableSpendingHandler(new TransactionRepository(_db), TestRules.Provider, new FixedRate(10m), new SavingsPlanRepository(_db),
            new InsightDismissalRepository(_db), new SubscriptionDecisionRepository(_db));

        var result = await handler.Handle(new GetAvoidableSpendingQuery(_me.Id, MonthStart, Now, null));

        Assert.Equal(5000, result.MonthCents);
        Assert.Equal(10m, result.CdiAnnualPercent);
        Assert.Equal(4m, result.InflationPercent);
        Assert.Equal("Cinema", Assert.Single(result.Superfluous).Name);
    }

    private sealed class FixedRate(decimal rate) : IInterestRateProvider
    {
        public Task<decimal> GetCdiAnnualPercentAsync(CancellationToken cancellationToken = default) => Task.FromResult(rate);

        public Task<decimal> GetInflation12MonthsPercentAsync(CancellationToken cancellationToken = default) => Task.FromResult(4m);
    }
}

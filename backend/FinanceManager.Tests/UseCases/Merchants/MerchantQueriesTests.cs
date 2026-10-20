using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Merchants;

public class MerchantQueriesTests
{
    private static readonly DateTime Start = new(2026, 8, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime End = new(2026, 10, 16, 15, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly Guid _me;
    private readonly Account _nubank;
    private readonly Account _itau;
    private readonly Category _alimentacao;
    private readonly Category _salario;
    private readonly Merchant _ifood;
    private readonly Merchant _uber;
    private readonly Merchant _foreign;

    public MerchantQueriesTests()
    {
        _me = _db.AddUser().Id;
        _nubank = _db.AddAccount(_me, "Nubank");
        _itau = _db.AddAccount(_me, "Itaú");
        _alimentacao = _db.AddCategory(_me, "Alimentação");
        _salario = _db.AddCategory(_me, "Salário", CategoryType.INCOME);
        _ifood = new Merchant { UserId = _me, Name = "iFood", Key = "ifood", Kind = MerchantKind.BUSINESS, CategoryId = _alimentacao.Id };
        _uber = new Merchant { UserId = _me, Name = "Uber", Key = "uber", Kind = MerchantKind.BUSINESS };
        _foreign = new Merchant { UserId = Guid.NewGuid(), Name = "Alheio", Key = "alheio" };
        _db.Merchants.AddRange(_ifood, _uber, _foreign);
        _db.SaveChanges();
    }

    private GetMerchantHistoryHandler HistoryHandler =>
        new(new MerchantRepository(_db), new TransactionRepository(_db));

    [Fact]
    public async Task GetMerchants_lists_the_users_merchants_by_name_with_their_category()
    {
        var merchants = await new GetMerchantsHandler(new MerchantRepository(_db)).Handle(new GetMerchantsQuery(_me));

        Assert.Equal(["iFood", "Uber"], merchants.Select(m => m.Name));
        Assert.Equal("Alimentação", merchants[0].CategoryName);
        Assert.Equal(string.Empty, merchants[1].CategoryName);
    }

    [Fact]
    public async Task GetMerchantSpending_ranks_the_expenses_of_the_period_by_merchant()
    {
        _db.AddTransaction(_nubank, _alimentacao, 3000, End.AddDays(-3), "iFood", _ifood);
        _db.AddTransaction(_nubank, _alimentacao, 5000, End.AddDays(-2), "iFood", _ifood);
        _db.AddTransaction(_nubank, _alimentacao, 2000, End.AddDays(-1), "Uber", _uber);
        _db.AddTransaction(_itau, _alimentacao, 90000, End.AddDays(-1), "Uber", _uber);
        _db.AddTransaction(_nubank, _salario, 100000, End.AddDays(-1), "Salário");

        var report = await new GetMerchantSpendingHandler(new TransactionRepository(_db), TestRules.Provider)
            .Handle(new GetMerchantSpendingQuery(_me, Start, End, _nubank.Id));

        Assert.Equal(10000, report.TotalCents);
        Assert.Equal(3, report.Count);
        Assert.Equal(["iFood", "Uber"], report.Merchants.Select(m => m.Name));
        Assert.Equal((2, 4000L, 0.8), (report.Merchants[0].Count, report.Merchants[0].AverageTicketCents, report.Merchants[0].Share));
    }

    [Fact]
    public async Task GetMerchantHistory_summarizes_the_merchant_month_by_month()
    {
        _db.AddTransaction(_nubank, _alimentacao, 3000, Start.AddDays(2), "iFood", _ifood);
        _db.AddTransaction(_nubank, _alimentacao, 5000, Start.AddMonths(2).AddDays(2), "iFood", _ifood);
        _db.AddTransaction(_nubank, _alimentacao, 4000, Start.AddMonths(2).AddDays(5), "iFood", _ifood);
        _db.AddTransaction(_nubank, _salario, 1000, Start.AddMonths(2).AddDays(6), "Estorno iFood", _ifood);
        _db.AddTransaction(_nubank, _alimentacao, 7000, Start.AddDays(2), "Uber", _uber);

        var history = await HistoryHandler.Handle(new GetMerchantHistoryQuery(_me, _ifood.Id, Start, End));

        Assert.Equal("iFood", history!.Merchant.Name);
        Assert.Equal([3000L, 0L, 9000L], history.Months.Select(m => m.ExpenseCents));
        Assert.Equal([0L, 0L, 1000L], history.Months.Select(m => m.IncomeCents));
        Assert.Equal([1, 0, 3], history.Months.Select(m => m.Count));
        Assert.Equal(12000, history.ExpenseCents);
        Assert.Equal(1000, history.IncomeCents);
        Assert.Equal(4, history.Count);
        Assert.Equal(6000, history.AverageMonthlyCents);
        Assert.Equal(4000, history.AverageTicketCents);
    }

    [Fact]
    public async Task GetMerchantHistory_of_a_merchant_without_transactions_has_zero_averages()
    {
        var history = await HistoryHandler.Handle(new GetMerchantHistoryQuery(_me, _uber.Id, Start, End));

        Assert.Equal(3, history!.Months.Count);
        Assert.Equal((0L, 0L, 0), (history.AverageMonthlyCents, history.AverageTicketCents, history.Count));
    }

    [Fact]
    public async Task GetMerchantHistory_returns_null_for_missing_or_foreign_merchants()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => HistoryHandler.Handle(new GetMerchantHistoryQuery(_me, Guid.NewGuid(), Start, End)));
        await Assert.ThrowsAsync<NotFoundException>(() => HistoryHandler.Handle(new GetMerchantHistoryQuery(_me, _foreign.Id, Start, End)));
    }
}

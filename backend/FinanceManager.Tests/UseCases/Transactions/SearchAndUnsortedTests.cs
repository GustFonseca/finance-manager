using FinanceManager.Aplication.UseCases.Merchants.Queries.GetUnsortedMerchants;
using FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;

namespace FinanceManager.Tests.UseCases.Transactions;

public sealed class SearchAndUnsortedTests : IDisposable
{
    private static readonly DateTime Day = new(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly User _me;
    private readonly Account _nubank;
    private readonly Account _itau;
    private readonly Category _alimentacao;
    private readonly Category _outros;
    private readonly Category _salario;

    public SearchAndUnsortedTests()
    {
        (_db, _connection) = TestDb.Sqlite();
        _me = _db.AddUser();
        _nubank = _db.AddAccount(_me.Id, "Nubank");
        _itau = _db.AddAccount(_me.Id, "Itaú");
        _alimentacao = _db.AddCategory(_me.Id, "Alimentação");
        _outros = _db.AddCategory(_me.Id, "Outros");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private Merchant AddMerchant(string name, Category? category)
    {
        var merchant = new Merchant { UserId = _me.Id, Name = name, Key = name.ToLower(), Kind = MerchantKind.BUSINESS, CategoryId = category?.Id };
        _db.Merchants.Add(merchant);
        _db.SaveChanges();
        return merchant;
    }

    [Fact]
    public async Task Search_filters_by_text_category_type_account_and_period()
    {
        var ifood = AddMerchant("iFood", _alimentacao);
        _db.AddTransaction(_nubank, _alimentacao, 4000, Day, "Compra no débito via NuPay", ifood);
        _db.AddTransaction(_itau, _outros, 2000, Day, "Pix para Toru");
        _db.AddTransaction(_nubank, _salario, 900000, Day.AddMonths(-1), "Salário Sensenet");
        var repository = new TransactionRepository(_db);

        Assert.Equal(["Compra no débito via NuPay"], (await repository.SearchAsync(_me.Id, new TransactionFilter(Search: " IFOOD "))).Select(t => t.Description));
        Assert.Equal(["Pix para Toru"], (await repository.SearchAsync(_me.Id, new TransactionFilter(Search: "toru"))).Select(t => t.Description));
        Assert.Single(await repository.SearchAsync(_me.Id, new TransactionFilter(CategoryId: _outros.Id)));
        Assert.Single(await repository.SearchAsync(_me.Id, new TransactionFilter(Type: TransactionType.INCOME)));
        Assert.Single(await repository.SearchAsync(_me.Id, new TransactionFilter(AccountId: _itau.Id)));
        Assert.Single(await repository.SearchAsync(_me.Id, new TransactionFilter(MerchantId: ifood.Id)));
        Assert.Equal(2, (await repository.SearchAsync(_me.Id, new TransactionFilter(Start: Day.AddDays(-1), End: Day.AddDays(1)))).Count);
        Assert.Empty(await repository.SearchAsync(Guid.NewGuid(), new TransactionFilter()));
    }

    [Fact]
    public async Task Searching_without_accents_finds_the_merchant_by_its_key()
    {
        var acougue = new Merchant { UserId = _me.Id, Name = "Açougue Central", Key = "acouguecentral", Kind = MerchantKind.BUSINESS };
        _db.Merchants.Add(acougue);
        _db.SaveChanges();
        _db.AddTransaction(_nubank, _alimentacao, 3000, Day, "Compra no débito - AÇOUGUE CENTRAL", acougue);
        var handler = new GetTransactionsByDateRangeHandler(new TransactionRepository(_db));

        var result = await handler.Handle(new GetTransactionsByDateRangeQuery(_me.Id, null, null, Search: "acougue"));

        Assert.Equal("Açougue Central", Assert.Single(result).MerchantName);
    }

    [Fact]
    public async Task The_query_passes_every_filter_to_the_search()
    {
        _db.AddTransaction(_nubank, _alimentacao, 4000, Day, "Mercado");
        _db.AddTransaction(_nubank, _salario, 900000, Day, "Salário");
        var handler = new GetTransactionsByDateRangeHandler(new TransactionRepository(_db));

        var result = await handler.Handle(new GetTransactionsByDateRangeQuery(
            _me.Id, Day.AddDays(-1), Day.AddDays(1), _nubank.Id, null, _alimentacao.Id, TransactionType.EXPENSE, "merc"));

        Assert.Equal("Mercado", Assert.Single(result).Description);
    }

    [Fact]
    public async Task Unsorted_merchants_are_those_without_a_category_or_in_outros_biggest_first()
    {
        var ifood = AddMerchant("iFood", _alimentacao);
        var toru = AddMerchant("Toru", null);
        var receita = AddMerchant("Receita Federal", _outros);
        _db.AddTransaction(_nubank, _alimentacao, 4000, Day, "iFood", ifood);
        _db.AddTransaction(_nubank, _outros, 2000, Day, "Toru", toru);
        _db.AddTransaction(_nubank, _outros, 60000, Day, "Receita Federal", receita);
        _db.AddTransaction(_nubank, _outros, 500, Day, "Sem estabelecimento");
        var handler = new GetUnsortedMerchantsHandler(new TransactionRepository(_db), new MerchantRepository(_db), TestRules.Provider);

        var unsorted = await handler.Handle(new GetUnsortedMerchantsQuery(_me.Id, Day.AddMonths(-12), Day.AddDays(1)));

        Assert.Equal(["Receita Federal", "Toru"], unsorted.Select(m => m.Name));
    }
}

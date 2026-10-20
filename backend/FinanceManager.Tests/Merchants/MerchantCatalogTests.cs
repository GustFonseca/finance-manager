using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Tests.Merchants;

public class MerchantCatalogTests
{
    private readonly AppDbContext _db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .AddInterceptors(new ActivityLogInterceptor())
        .Options);

    private readonly User _me = new() { Name = "Gustavo Fonseca Dias Silva", Email = "g@x.com", GoogleId = "g" };
    private readonly Account _account;
    private readonly Category _alimentacao;
    private readonly Category _outros;

    private TransactionRepository Transactions => new(_db);
    private MerchantRepository Merchants => new(_db);

    public MerchantCatalogTests()
    {
        _account = new Account(_me.Id, "Nubank");
        _alimentacao = new Category { UserId = _me.Id, Name = "Alimentação", Type = CategoryType.EXPENSE };
        _outros = new Category { UserId = _me.Id, Name = "Outros", Type = CategoryType.EXPENSE };
        _db.AddRange(_me, _account, _alimentacao, _outros);
        _db.SaveChanges();
    }

    private Task Create(string description, Category category, long cents = 4590) =>
        new CreateTransactionHandler(Transactions, new AccountRepository(_db), new CategoryRepository(_db), Merchants, new UserRepository(_db), TestRules.Provider)
            .Handle(new CreateTransactionCommand(_me.Id, _account.Id, category.Id, TransactionType.EXPENSE, cents, description, DateTime.UtcNow, Recurrence.NONE));

    [Fact]
    public async Task New_transactions_are_filed_under_one_merchant_which_learns_the_category()
    {
        await Create("Compra no débito via NuPay - iFood", _alimentacao);
        await Create("Transferência enviada pelo Pix - IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A. - 14.380.200/0001-21 - ADYEN", _alimentacao);

        var ifood = Assert.Single(_db.Merchants);
        Assert.Equal("iFood", ifood.Name);
        Assert.Equal(_alimentacao.Id, ifood.CategoryId);
        Assert.All(_db.Transactions, t => Assert.Equal(ifood.Id, t.MerchantId));

        var match = Assert.Single(await new ResolveMerchantsHandler(Merchants, new CategoryRepository(_db), new UserRepository(_db), TestRules.Provider)
            .Handle(new ResolveMerchantsQuery(_me.Id, [new ImportLineRequest { Description = "Ifd*Restaurante Sabor Caseiro", Type = TransactionType.EXPENSE }])));
        Assert.Equal(ifood.Id, match.MerchantId);
        Assert.Equal(_alimentacao.Id, match.CategoryId);
    }

    [Fact]
    public async Task Outros_is_not_learned_as_a_category()
    {
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);

        Assert.Null(Assert.Single(_db.Merchants).CategoryId);
    }

    [Fact]
    public async Task Old_transactions_are_catalogued_and_merchants_learn_their_usual_category()
    {
        _db.Transactions.AddRange(
            Tx("Compra no débito via NuPay - iFood", _alimentacao),
            Tx("Ifd*Pizzaria Bella", _alimentacao),
            Tx("Ifd*Lanches", _outros),
            Tx("Resgate RDB", _outros));
        _db.SaveChanges();

        var filed = await new CatalogTransactionsHandler(Transactions, Merchants, new UserRepository(_db), TestRules.Provider).Handle(new CatalogTransactionsCommand());

        Assert.Equal(4, filed);
        var ifood = _db.Merchants.Single(m => m.Key == "ifood");
        Assert.Equal(_alimentacao.Id, ifood.CategoryId);
        Assert.Equal(MerchantKind.OWN, _db.Merchants.Single(m => m.Key == "investimentos").Kind);
        Assert.Equal(0, await new CatalogTransactionsHandler(Transactions, Merchants, new UserRepository(_db), TestRules.Provider).Handle(new CatalogTransactionsCommand()));
    }

    [Fact]
    public async Task Changing_a_merchants_category_can_move_its_transactions_too()
    {
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);
        var toru = Assert.Single(_db.Merchants);

        var result = await new UpdateMerchantHandler(Merchants, new CategoryRepository(_db), Transactions)
            .Handle(new UpdateMerchantCommand(_me.Id, toru.Id, "Toru Sushi", MerchantKind.BUSINESS, _alimentacao.Id, ApplyToTransactions: true));

        Assert.Equal(2, result!.UpdatedTransactions);
        Assert.Equal("Alimentação", result.Merchant.CategoryName);
        Assert.All(_db.Transactions, t => Assert.Equal(_alimentacao.Id, t.CategoryId));
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Estabelecimento renomeado: Toru → Toru Sushi");
    }

    [Fact]
    public async Task A_name_already_used_by_another_merchant_is_refused()
    {
        await Create("Compra no débito via NuPay - iFood", _alimentacao);
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);
        var toru = _db.Merchants.Single(m => m.Key == "toru");

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new UpdateMerchantHandler(Merchants, new CategoryRepository(_db), Transactions)
                .Handle(new UpdateMerchantCommand(_me.Id, toru.Id, "IFOOD", MerchantKind.BUSINESS, null, false)));
    }

    [Fact]
    public void The_merchant_report_groups_by_place_and_leaves_own_money_out()
    {
        var report = MerchantAnalyzer.Report(
        [
            Tx("Compra no débito via NuPay - iFood", _alimentacao, 3000),
            Tx("Transferência enviada pelo Pix - IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A. - 14.380.200/0001-21 - ADYEN", _alimentacao, 5000),
            Tx("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros, 2000),
            Tx("Aplicação RDB", _outros, 90000),
        ], TestRules.Default);

        Assert.Equal(10000, report.TotalCents);
        var ifood = report.Merchants[0];
        Assert.Equal("iFood", ifood.Name);
        Assert.Equal(2, ifood.Count);
        Assert.Equal(8000, ifood.Cents);
        Assert.Equal(4000, ifood.AverageTicketCents);
        Assert.Equal(0.8, ifood.Share, 3);
        Assert.Equal(["iFood", "Toru"], report.Merchants.Select(m => m.Name));
    }

    private ImportTransactionsHandler Importer() =>
        new(Transactions, new AccountRepository(_db), new CategoryRepository(_db), Merchants, new UserRepository(_db), TestRules.Provider);

    private ImportTransactionLine Line(string description, long cents, Category category, TransactionType type = TransactionType.EXPENSE) =>
        new() { Date = DateTime.UtcNow, Description = description, AmountCents = cents, Type = type, CategoryId = category.Id };

    [Fact]
    public async Task An_import_moves_the_balance_once_and_is_one_history_entry()
    {
        var imported = await Importer().Handle(new ImportTransactionsCommand(_me.Id, _account.Id,
        [
            Line("Compra no débito via NuPay - iFood", 4000, _alimentacao),
            Line("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", 6000, _outros),
        ]));

        Assert.Equal(2, imported);
        Assert.Equal(-10000, (await new AccountRepository(_db).GetByIdAsync(_account.Id))!.BalanceCents);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "2 transações importadas de uma vez");
        Assert.All(_db.Transactions, t => Assert.NotNull(t.MerchantId));
    }

    [Fact]
    public async Task An_import_line_under_a_category_of_the_wrong_type_is_refused_with_its_line()
    {
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() => Importer().Handle(new ImportTransactionsCommand(_me.Id, _account.Id,
        [
            Line("Compra no débito via NuPay - iFood", 4000, _alimentacao),
            Line("Transferência recebida - Empresa", 900000, _alimentacao, TransactionType.INCOME),
        ])));

        Assert.StartsWith("Linha 2", error.Message);
        Assert.Empty(_db.Transactions);
    }

    private Transaction Tx(string description, Category category, long cents = 1000) => new()
    {
        UserId = _me.Id,
        AccountId = _account.Id,
        CategoryId = category.Id,
        Category = category,
        Description = description,
        AmountCents = cents,
        Type = TransactionType.EXPENSE,
        Date = DateTime.UtcNow,
    };
}

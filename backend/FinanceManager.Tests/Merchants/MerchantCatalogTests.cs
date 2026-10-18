using AutoMapper;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Tests.Merchants;

/// <summary>Filing transactions under merchants, through the real repositories.</summary>
public class MerchantCatalogTests
{
    private readonly AppDbContext _db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .AddInterceptors(new ActivityLogInterceptor())
        .Options);

    private readonly IMapper _mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(MerchantProfile).Assembly)).CreateMapper();

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
        new CreateTransactionHandler(Transactions, new AccountRepository(_db), new CategoryRepository(_db), Merchants, new UserRepository(_db), _mapper)
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

        // The next import suggests what the user chose.
        var match = Assert.Single(await new ResolveMerchantsHandler(Merchants, new UserRepository(_db))
            .Handle(new ResolveMerchantsQuery(_me.Id, ["Ifd*Restaurante Sabor Caseiro"])));
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

        var filed = await new CatalogTransactionsHandler(Transactions, Merchants, new UserRepository(_db)).Handle(new CatalogTransactionsCommand());

        Assert.Equal(4, filed);
        var ifood = _db.Merchants.Single(m => m.Key == "ifood");
        Assert.Equal(_alimentacao.Id, ifood.CategoryId);
        Assert.Equal(MerchantKind.OWN, _db.Merchants.Single(m => m.Key == "investimentos").Kind);
        // Nothing left to file: running it again is a no-op.
        Assert.Equal(0, await new CatalogTransactionsHandler(Transactions, Merchants, new UserRepository(_db)).Handle(new CatalogTransactionsCommand()));
    }

    [Fact]
    public async Task Changing_a_merchants_category_can_move_its_transactions_too()
    {
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);
        await Create("Transferência enviada pelo Pix - TORU - 24.444.401/0001-07 - ITAÚ", _outros);
        var toru = Assert.Single(_db.Merchants);

        var result = await new UpdateMerchantHandler(Merchants, new CategoryRepository(_db), Transactions, _mapper)
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

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new UpdateMerchantHandler(Merchants, new CategoryRepository(_db), Transactions, _mapper)
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
        ]);

        Assert.Equal(10000, report.TotalCents);
        var ifood = report.Merchants[0];
        Assert.Equal("iFood", ifood.Name);
        Assert.Equal(2, ifood.Count);
        Assert.Equal(8000, ifood.Cents);
        Assert.Equal(4000, ifood.AverageTicketCents);
        Assert.Equal(0.8, ifood.Share, 3);
        Assert.Equal(["iFood", "Toru"], report.Merchants.Select(m => m.Name));
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

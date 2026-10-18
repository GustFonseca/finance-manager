using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Merchants;

public class MerchantCommandsTests
{
    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Merchant _toru;

    public MerchantCommandsTests()
    {
        _me = _db.AddUser("Gustavo Fonseca Dias Silva");
        _toru = new Merchant { UserId = _me.Id, Name = "Toru", Key = "toru", Kind = MerchantKind.BUSINESS };
        _db.Merchants.Add(_toru);
        _db.SaveChanges();
    }

    private UpdateMerchantHandler UpdateHandler =>
        new(new MerchantRepository(_db), new CategoryRepository(_db), new TransactionRepository(_db), TestDb.Mapper);

    private Task<List<MerchantMatchDto>> Resolve(params ImportLineRequest[] lines) =>
        new ResolveMerchantsHandler(new MerchantRepository(_db), new CategoryRepository(_db), new UserRepository(_db), TestRules.Provider)
            .Handle(new ResolveMerchantsQuery(_me.Id, [.. lines]));

    private static ImportLineRequest Line(string description, TransactionType type = TransactionType.EXPENSE) =>
        new() { Description = description, Type = type };

    [Theory]
    [InlineData("   ")]
    [InlineData("")]
    public async Task A_blank_merchant_name_is_refused(string name)
    {
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, name, MerchantKind.BUSINESS, null, false)));

        Assert.StartsWith("O nome deve ter entre 1 e", error.Message);
    }

    [Fact]
    public async Task A_name_over_the_limit_is_refused()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, new string('a', 101), MerchantKind.BUSINESS, null, false)));
    }

    [Fact]
    public async Task A_missing_or_foreign_category_is_refused()
    {
        var foreign = _db.AddCategory(Guid.NewGuid(), "Lazer");

        var missing = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, "Toru", MerchantKind.BUSINESS, Guid.NewGuid(), false)));
        var notMine = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, "Toru", MerchantKind.BUSINESS, foreign.Id, false)));

        Assert.Equal("Categoria não encontrada", missing.Message);
        Assert.Equal("Categoria não encontrada", notMine.Message);
        Assert.Null(_toru.CategoryId);
    }

    [Fact]
    public async Task A_missing_or_foreign_merchant_is_not_found()
    {
        var foreign = new Merchant { UserId = Guid.NewGuid(), Name = "Alheio", Key = "alheio" };
        _db.Merchants.Add(foreign);
        _db.SaveChanges();

        Assert.Null(await UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, Guid.NewGuid(), "x", MerchantKind.BUSINESS, null, false)));
        Assert.Null(await UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, foreign.Id, "x", MerchantKind.BUSINESS, null, false)));
    }

    [Fact]
    public async Task Changing_the_kind_without_a_category_updates_no_transactions()
    {
        var result = await UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, " Toru ", MerchantKind.PERSON, null, true));

        Assert.Equal(("Toru", MerchantKind.PERSON, 0), (result!.Merchant.Name, result.Merchant.Kind, result.UpdatedTransactions));
    }

    [Fact]
    public async Task Applying_a_category_that_every_transaction_already_has_changes_nothing()
    {
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        _db.AddTransaction(_db.AddAccount(_me.Id), lazer, 1000, DateTime.UtcNow, "Toru", _toru);

        var result = await UpdateHandler.Handle(new UpdateMerchantCommand(_me.Id, _toru.Id, "Toru", MerchantKind.BUSINESS, lazer.Id, true));

        Assert.Equal(0, result!.UpdatedTransactions);
        Assert.Equal("Lazer", result.Merchant.CategoryName);
    }

    [Fact]
    public async Task Resolving_uses_the_category_hint_of_the_description()
    {
        var transporte = _db.AddCategory(_me.Id, "Transporte");
        _db.AddCategory(_me.Id, "Outros");

        var match = Assert.Single(await Resolve(Line("UBER *TRIP HELP.UBER.COM")));

        Assert.Equal("Uber", match.Name);
        Assert.Null(match.MerchantId);
        Assert.Equal(transporte.Id, match.CategoryId);
        Assert.Null(match.SkipReason);
    }

    [Fact]
    public async Task Resolving_falls_back_to_the_catch_all_then_to_any_category_of_the_type()
    {
        _db.AddCategory(_me.Id, "Moradia");
        var outros = _db.AddCategory(_me.Id, "Outros");
        var salario = _db.AddCategory(_me.Id, "Bicos", CategoryType.INCOME);

        var matches = await Resolve(Line("Toru"), Line("Recebido de cliente", TransactionType.INCOME));

        Assert.Equal(outros.Id, matches[0].CategoryId);
        Assert.Equal(_toru.Id, matches[0].MerchantId);
        Assert.Equal(salario.Id, matches[1].CategoryId);
    }

    [Fact]
    public async Task Resolving_without_categories_suggests_none_and_marks_own_money_to_skip()
    {
        var matches = await Resolve(Line("Pagamento de fatura"), Line("Toru"));

        Assert.All(matches, m => Assert.Null(m.CategoryId));
        Assert.Equal(MerchantKind.OWN, matches[0].Kind);
        Assert.EndsWith(": movimentação entre suas contas, não é renda nem gasto", matches[0].SkipReason);
        Assert.Null(matches[1].SkipReason);
    }
}

using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Transactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Transactions;

public class TransactionHandlersTests
{
    private static readonly DateTime Day = new(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _nubank;
    private readonly Category _lazer;
    private readonly Category _salario;

    public TransactionHandlersTests()
    {
        _me = _db.AddUser();
        _nubank = _db.AddAccount(_me.Id, "Nubank");
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
    }

    private DeleteTransactionHandler DeleteHandler => new(new TransactionRepository(_db), new AccountRepository(_db));

    private CreateTransactionHandler CreateHandler => new(
        new TransactionRepository(_db), new AccountRepository(_db), new CategoryRepository(_db),
        new MerchantRepository(_db), new UserRepository(_db), TestRules.Provider);

    private CreateTransactionCommand Command(Guid accountId, Guid categoryId, TransactionType type = TransactionType.EXPENSE, long cents = 1000, string description = "Cinema", DateTime? date = null) =>
        new(_me.Id, accountId, categoryId, type, cents, description, date ?? Day, Recurrence.NONE);

    [Fact]
    public async Task Deleting_an_expense_gives_the_amount_back_to_the_account()
    {
        var transaction = _db.AddTransaction(_nubank, _lazer, 2500, Day);
        _nubank.SubtractBalance(2500);
        _db.SaveChanges();

        await DeleteHandler.Handle(new DeleteTransactionCommand(_me.Id, transaction.Id), CancellationToken.None);

        Assert.Empty(_db.Transactions);
        Assert.Equal(0, _db.Accounts.Single().BalanceCents);
    }

    [Fact]
    public async Task Deleting_an_income_takes_the_amount_out_of_the_account()
    {
        var transaction = _db.AddTransaction(_nubank, _salario, 9000, Day);

        await DeleteHandler.Handle(new DeleteTransactionCommand(_me.Id, transaction.Id), CancellationToken.None);

        Assert.Equal(-9000, _db.Accounts.Single().BalanceCents);
    }

    [Fact]
    public async Task Deleting_a_missing_or_foreign_transaction_is_not_found()
    {
        var foreignAccount = _db.AddAccount(Guid.NewGuid(), "Alheia");
        var foreign = _db.AddTransaction(foreignAccount, _lazer, 100, Day);

        var missing = await Assert.ThrowsAsync<NotFoundException>(() => DeleteHandler.Handle(new DeleteTransactionCommand(_me.Id, Guid.NewGuid()), CancellationToken.None));
        var notMine = await Assert.ThrowsAsync<NotFoundException>(() => DeleteHandler.Handle(new DeleteTransactionCommand(_me.Id, foreign.Id), CancellationToken.None));

        Assert.Equal("Transação não encontrada.", missing.Message);
        Assert.Equal("Transação não encontrada.", notMine.Message);
        Assert.Single(_db.Transactions);
    }

    [Fact]
    public async Task Deleting_a_transaction_whose_account_is_gone_is_not_found()
    {
        var orphan = new Transaction { UserId = _me.Id, AccountId = Guid.NewGuid(), CategoryId = _lazer.Id, AmountCents = 100, Date = Day };
        _db.Transactions.Add(orphan);
        _db.SaveChanges();

        var error = await Assert.ThrowsAsync<NotFoundException>(() => DeleteHandler.Handle(new DeleteTransactionCommand(_me.Id, orphan.Id), CancellationToken.None));

        Assert.Equal("Conta não encontrada.", error.Message);
    }

    [Fact]
    public async Task GetTransactionsByDateRange_filters_by_period_account_and_merchant_newest_first()
    {
        var itau = _db.AddAccount(_me.Id, "Itaú");
        var merchant = new Merchant { UserId = _me.Id, Name = "Cinemark", Key = "cinemark" };
        _db.Merchants.Add(merchant);
        _db.SaveChanges();
        _db.AddTransaction(_nubank, _lazer, 100, Day.AddDays(-1), "Antes");
        _db.AddTransaction(_nubank, _lazer, 200, Day.AddDays(1), "Depois", merchant);
        _db.AddTransaction(itau, _lazer, 300, Day, "Outra conta");
        _db.AddTransaction(_nubank, _lazer, 400, Day.AddDays(-30), "Fora");
        var handler = new GetTransactionsByDateRangeHandler(new TransactionRepository(_db));

        var period = await handler.Handle(new GetTransactionsByDateRangeQuery(_me.Id, Day.AddDays(-7), Day.AddDays(7)));
        var nubank = await handler.Handle(new GetTransactionsByDateRangeQuery(_me.Id, Day.AddDays(-7), Day.AddDays(7), _nubank.Id));
        var cinemark = await handler.Handle(new GetTransactionsByDateRangeQuery(_me.Id, null, null, null, merchant.Id));
        var all = await handler.Handle(new GetTransactionsByDateRangeQuery(_me.Id, null, null));

        Assert.Equal(["Depois", "Outra conta", "Antes"], period.Select(t => t.Description));
        Assert.Equal(["Depois", "Antes"], nubank.Select(t => t.Description));
        var only = Assert.Single(cinemark);
        Assert.Equal(("Cinemark", "Nubank", "Lazer"), (only.MerchantName, only.AccountName, only.CategoryName));
        Assert.Equal(4, all.Count);
    }

    [Fact]
    public async Task Creating_a_transaction_in_a_missing_or_foreign_account_is_rejected()
    {
        var foreign = _db.AddAccount(Guid.NewGuid(), "Alheia");

        var missing = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(Guid.NewGuid(), _lazer.Id)));
        var notMine = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(foreign.Id, _lazer.Id)));

        Assert.Equal("Conta não encontrada.", missing.Message);
        Assert.Equal("Conta não encontrada.", notMine.Message);
        Assert.Empty(_db.Transactions);
    }

    [Fact]
    public async Task Creating_a_transaction_in_a_missing_or_foreign_category_is_rejected()
    {
        var foreign = _db.AddCategory(Guid.NewGuid(), "Lazer");

        var missing = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, Guid.NewGuid())));
        var notMine = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, foreign.Id)));

        Assert.Equal("Categoria não encontrada.", missing.Message);
        Assert.Equal("Categoria não encontrada.", notMine.Message);
    }

    [Fact]
    public async Task Creating_a_transaction_validates_amount_description_and_category_type()
    {
        var zero = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, _lazer.Id, cents: 0)));
        var tooLong = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, _lazer.Id, description: new string('x', 501))));
        var wrongType = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, _salario.Id)));
        var wrongExpense = await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(Command(_nubank.Id, _lazer.Id, TransactionType.INCOME)));

        Assert.Equal("O valor deve ser maior que zero.", zero.Message);
        Assert.Equal("A descrição pode ter no máximo 500 caracteres.", tooLong.Message);
        Assert.Equal("A categoria Salário é de receita.", wrongType.Message);
        Assert.Equal("A categoria Lazer é de despesa.", wrongExpense.Message);
    }

    [Fact]
    public async Task Creating_an_income_adds_to_the_balance_and_stores_the_date_as_utc()
    {
        var local = new DateTime(2026, 10, 10, 9, 0, 0, DateTimeKind.Unspecified);

        var dto = await CreateHandler.Handle(Command(_nubank.Id, _salario.Id, TransactionType.INCOME, 500000, "Salário ACME", local));

        Assert.Equal(500000, _db.Accounts.Single(a => a.Id == _nubank.Id).BalanceCents);
        Assert.Equal(DateTimeKind.Utc, dto.Date.Kind);
        Assert.Equal(local.Ticks, dto.Date.Ticks);
    }

    [Theory]
    [InlineData(DateTimeKind.Utc)]
    [InlineData(DateTimeKind.Local)]
    [InlineData(DateTimeKind.Unspecified)]
    public void ToUtc_always_returns_a_utc_date(DateTimeKind kind)
    {
        var date = new DateTime(2026, 10, 10, 9, 0, 0, kind);

        var utc = TransactionInput.ToUtc(date);

        Assert.Equal(DateTimeKind.Utc, utc.Kind);
        Assert.Equal(kind == DateTimeKind.Local ? date.ToUniversalTime() : DateTime.SpecifyKind(date, DateTimeKind.Utc), utc);
    }
}

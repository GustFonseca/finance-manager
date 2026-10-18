using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.UpdateTransaction;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Transactions;

public class UpdateTransactionTests
{
    private static readonly DateTime Day = new(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _nubank;
    private readonly Account _itau;
    private readonly Category _lazer;
    private readonly Category _alimentacao;
    private readonly Category _salario;
    private readonly Transaction _cinema;

    public UpdateTransactionTests()
    {
        _me = _db.AddUser("Gustavo Fonseca Dias Silva");
        _nubank = _db.AddAccount(_me.Id, "Nubank");
        _itau = _db.AddAccount(_me.Id, "Itaú");
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _alimentacao = _db.AddCategory(_me.Id, "Alimentação");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
        _cinema = _db.AddTransaction(_nubank, _lazer, 3000, Day, "Cinema");
        _nubank.SubtractBalance(3000);
        _db.SaveChanges();
    }

    private UpdateTransactionHandler Handler => new(
        new TransactionRepository(_db), new AccountRepository(_db), new CategoryRepository(_db),
        new MerchantRepository(_db), new UserRepository(_db), TestRules.Provider, TestDb.Mapper);

    private UpdateTransactionCommand Command(
        Guid? accountId = null, Guid? categoryId = null, TransactionType type = TransactionType.EXPENSE,
        long cents = 3000, string description = "Cinema", DateTime? date = null, Guid? transactionId = null, Guid? userId = null) =>
        new(userId ?? _me.Id, transactionId ?? _cinema.Id, accountId ?? _nubank.Id, categoryId ?? _lazer.Id,
            type, cents, description, date ?? Day, Recurrence.NONE);

    private long Balance(Account account) => _db.Accounts.Single(a => a.Id == account.Id).BalanceCents;

    [Fact]
    public async Task Changing_the_amount_moves_the_balance_by_the_difference()
    {
        var dto = await Handler.Handle(Command(cents: 4500));

        Assert.Equal(4500, dto.AmountCents);
        Assert.Equal(-4500, Balance(_nubank));
    }

    [Fact]
    public async Task Moving_to_another_account_gives_the_money_back_to_the_first_one()
    {
        var dto = await Handler.Handle(Command(accountId: _itau.Id));

        Assert.Equal(0, Balance(_nubank));
        Assert.Equal(-3000, Balance(_itau));
        Assert.Equal("Itaú", dto.AccountName);
    }

    [Fact]
    public async Task Turning_an_expense_into_an_income_flips_its_effect()
    {
        var dto = await Handler.Handle(Command(categoryId: _salario.Id, type: TransactionType.INCOME, cents: 9000, description: "Salário"));

        Assert.Equal(TransactionType.INCOME, dto.Type);
        Assert.Equal(9000, Balance(_nubank));
    }

    [Fact]
    public async Task Date_category_description_and_merchant_are_updated()
    {
        var date = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Unspecified);

        var dto = await Handler.Handle(Command(categoryId: _alimentacao.Id, description: "Compra no débito via NuPay - iFood", date: date));

        Assert.Equal("Alimentação", dto.CategoryName);
        Assert.Equal("iFood", dto.MerchantName);
        Assert.Equal(DateTimeKind.Utc, _db.Transactions.Single().Date.Kind);
        Assert.Equal(_alimentacao.Id, _db.Merchants.Single().CategoryId);
        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Transação alterada: Compra no débito via NuPay - iFood"));
    }

    [Fact]
    public async Task Someone_elses_transaction_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => Handler.Handle(Command(userId: Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => Handler.Handle(Command(transactionId: Guid.NewGuid())));
    }

    [Fact]
    public async Task Invalid_values_are_refused_without_touching_the_balance()
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(cents: 0)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(accountId: Guid.NewGuid())));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(categoryId: Guid.NewGuid())));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(categoryId: _salario.Id)));

        Assert.Equal(-3000, Balance(_nubank));
    }

    [Fact]
    public async Task An_account_or_category_of_another_user_is_refused()
    {
        var other = _db.AddUser("Outra Pessoa");
        var otherAccount = _db.AddAccount(other.Id, "Dela");
        var otherCategory = _db.AddCategory(other.Id, "Dela");

        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(accountId: otherAccount.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Handler.Handle(Command(categoryId: otherCategory.Id)));
    }
}

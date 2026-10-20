using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.DeleteAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Accounts;

public class AccountHandlersTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly AppDbContext _db = TestDb.InMemory();

    private AccountRepository Accounts => new(_db);

    [Fact]
    public async Task CreateAccount_saves_the_account_with_a_zero_balance()
    {
        var dto = await new CreateAccountHandler(Accounts).Handle(new CreateAccountCommand(Me, "Nubank"));

        var saved = Assert.Single(_db.Accounts);
        Assert.Equal(saved.Id, dto.Id);
        Assert.Equal("Nubank", dto.Name);
        Assert.Equal(0, dto.BalanceCents);
        Assert.Equal(Me, saved.UserId);
    }

    [Fact]
    public async Task GetAllAccounts_returns_only_the_users_accounts()
    {
        _db.AddAccount(Me, "Nubank");
        _db.AddAccount(Me, "Itaú");
        _db.AddAccount(SomeoneElse, "Inter");

        var accounts = await new GetAllAccountsHandler(Accounts).Handle(new GetAllAccountsQuery(Me));

        Assert.Equal(["Itaú", "Nubank"], accounts.Select(a => a.Name).Order());
    }

    [Fact]
    public async Task UpdateAccount_renames_the_users_account()
    {
        var account = _db.AddAccount(Me, "Nubank");

        var dto = await new UpdateAccountHandler(Accounts).Handle(new UpdateAccountCommand(Me, account.Id, "Nubank PF"));

        Assert.Equal("Nubank PF", dto!.Name);
        Assert.Equal("Nubank PF", (await Accounts.GetByIdAsync(account.Id))!.Name);
    }

    [Fact]
    public async Task UpdateAccount_returns_null_for_a_missing_or_foreign_account()
    {
        var foreign = _db.AddAccount(SomeoneElse, "Inter");
        var handler = new UpdateAccountHandler(Accounts);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateAccountCommand(Me, Guid.NewGuid(), "x")));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateAccountCommand(Me, foreign.Id, "x")));
        Assert.Equal("Inter", foreign.Name);
    }

    [Fact]
    public async Task DeleteAccount_removes_an_account_without_transactions()
    {
        var account = _db.AddAccount(Me);

        await new DeleteAccountHandler(Accounts, new TransactionRepository(_db)).Handle(new DeleteAccountCommand(Me, account.Id));

        Assert.Empty(_db.Accounts);
    }

    [Fact]
    public async Task DeleteAccount_returns_false_for_a_missing_or_foreign_account()
    {
        var foreign = _db.AddAccount(SomeoneElse);
        var handler = new DeleteAccountHandler(Accounts, new TransactionRepository(_db));

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteAccountCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteAccountCommand(Me, foreign.Id)));
        Assert.Single(_db.Accounts);
    }

    [Fact]
    public async Task DeleteAccount_refuses_an_account_that_has_transactions()
    {
        var account = _db.AddAccount(Me);
        _db.AddTransaction(account, _db.AddCategory(Me, "Lazer"), 1000, DateTime.UtcNow);

        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new DeleteAccountHandler(Accounts, new TransactionRepository(_db)).Handle(new DeleteAccountCommand(Me, account.Id)));

        Assert.Equal("Não é possível excluir uma conta que tem transações. Apague as transações dela antes.", error.Message);
        Assert.Single(_db.Accounts);
    }
}

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;
using FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;
using FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;
using FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FinanceManager.Tests.UseCases;

public class InputValidationTests
{
    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;

    public InputValidationTests()
    {
        _me = _db.AddUser();
    }

    public static TheoryData<string?> BadNames => new() { null, "", "   ", new string('n', 101) };

    [Theory]
    [MemberData(nameof(BadNames))]
    public async Task Accounts_need_a_name_of_up_to_100_characters(string? name)
    {
        var account = _db.AddAccount(_me.Id);

        await Assert.ThrowsAsync<BusinessRuleException>(() => new CreateAccountHandler(new AccountRepository(_db)).Handle(new CreateAccountCommand(_me.Id, name!)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => new UpdateAccountHandler(new AccountRepository(_db)).Handle(new UpdateAccountCommand(_me.Id, account.Id, name!)));
    }

    [Fact]
    public async Task Account_names_are_trimmed()
    {
        var dto = await new CreateAccountHandler(new AccountRepository(_db)).Handle(new CreateAccountCommand(_me.Id, "  Nubank  "));

        Assert.Equal("Nubank", dto.Name);
    }

    public static TheoryData<string?, string?, CategoryType> BadCategories => new()
    {
        { null, "#FF0000", CategoryType.EXPENSE },
        { new string('c', 101), "#FF0000", CategoryType.EXPENSE },
        { "Lazer", "red", CategoryType.EXPENSE },
        { "Lazer", "#FF00", CategoryType.EXPENSE },
        { "Lazer", null, CategoryType.EXPENSE },
        { "Lazer", "#FF0000", (CategoryType)9 },
    };

    [Theory]
    [MemberData(nameof(BadCategories))]
    public async Task Categories_need_a_name_a_hex_color_and_a_known_type(string? name, string? color, CategoryType type)
    {
        var category = _db.AddCategory(_me.Id, "Outros");

        await Assert.ThrowsAsync<BusinessRuleException>(() => new CreateCategoryHandler(new CategoryRepository(_db)).Handle(new CreateCategoryCommand(_me.Id, name!, type, color!)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => new UpdateCategoryHandler(new CategoryRepository(_db)).Handle(new UpdateCategoryCommand(_me.Id, category.Id, name!, type, color!)));
    }

    [Fact]
    public async Task A_valid_category_is_saved_trimmed()
    {
        var dto = await new CreateCategoryHandler(new CategoryRepository(_db)).Handle(new CreateCategoryCommand(_me.Id, " Pets ", CategoryType.EXPENSE, " #a1B2c3 "));

        Assert.Equal(("Pets", "#a1B2c3"), (dto.Name, dto.Color));
    }

    [Theory]
    [InlineData("", 1000)]
    [InlineData("Viagem", 0)]
    [InlineData("Viagem", -5)]
    public async Task Goals_need_a_name_and_a_positive_target(string name, long target)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => new CreateGoalHandler(new GoalRepository(_db)).Handle(new CreateGoalCommand(_me.Id, name, target, null)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public async Task Goal_progress_must_be_positive(long cents)
    {
        var goal = new Goal { UserId = _me.Id, Name = "Viagem", TargetCents = 1000 };
        _db.Goals.Add(goal);
        _db.SaveChanges();

        await Assert.ThrowsAsync<BusinessRuleException>(() => new UpdateGoalProgressHandler(new GoalRepository(_db)).Handle(new UpdateGoalProgressCommand(_me.Id, goal.Id, cents)));
        Assert.Equal(0, _db.Goals.Single().CurrentCents);
    }

    private CreateTransactionHandler CreateHandler => new(
        new TransactionRepository(_db), new AccountRepository(_db), new CategoryRepository(_db),
        new MerchantRepository(_db), new UserRepository(_db), TestRules.Provider);

    [Theory]
    [InlineData((TransactionType)7, Recurrence.NONE)]
    [InlineData(TransactionType.EXPENSE, (Recurrence)42)]
    public async Task Transactions_need_a_known_type_and_recurrence(TransactionType type, Recurrence recurrence)
    {
        var account = _db.AddAccount(_me.Id);
        var category = _db.AddCategory(_me.Id, "Lazer");

        await Assert.ThrowsAsync<BusinessRuleException>(() => CreateHandler.Handle(
            new CreateTransactionCommand(_me.Id, account.Id, category.Id, type, 1000, "Cinema", DateTime.UtcNow, recurrence)));
    }

    [Fact]
    public async Task A_missing_description_is_saved_as_empty()
    {
        var account = _db.AddAccount(_me.Id);
        var category = _db.AddCategory(_me.Id, "Lazer");

        var dto = await CreateHandler.Handle(new CreateTransactionCommand(_me.Id, account.Id, category.Id, TransactionType.EXPENSE, 1000, null!, DateTime.UtcNow, Recurrence.NONE));

        Assert.Equal(string.Empty, _db.Transactions.Single(t => t.Id == dto.Id).Description);
    }
}

public sealed class BatchingTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly SaveCounter _saves = new();
    private readonly User _me;

    public BatchingTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(new ActivityLogInterceptor(), _saves)
            .Options);
        _db.Database.EnsureCreated();
        _me = _db.AddUser();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task An_import_saves_new_merchants_together_with_the_transactions()
    {
        var account = _db.AddAccount(_me.Id);
        var category = _db.AddCategory(_me.Id, "Lazer");
        _saves.Count = 0;
        var lines = new[] { "Cinemark Paulista", "Livraria Cultura", "Padaria Real", "Cinemark Paulista" }
            .Select(d => new ImportTransactionLine { Date = DateTime.UtcNow, Description = d, AmountCents = 1000, Type = TransactionType.EXPENSE, CategoryId = category.Id })
            .ToList();

        var imported = await new ImportTransactionsHandler(new TransactionRepository(_db), new AccountRepository(_db), new CategoryRepository(_db),
            new MerchantRepository(_db), new UserRepository(_db), TestRules.Provider).Handle(new ImportTransactionsCommand(_me.Id, account.Id, lines));

        Assert.Equal(4, imported);
        Assert.Equal(2, _saves.Count);
        _db.ChangeTracker.Clear();
        Assert.Equal(3, _db.Merchants.Count());
        Assert.All(_db.Merchants, m => Assert.Equal(category.Id, m.CategoryId));
        Assert.All(_db.Transactions, t => Assert.NotNull(t.MerchantId));
    }

    [Fact]
    public async Task Cataloguing_tries_each_transaction_once_and_respects_the_limit()
    {
        var account = _db.AddAccount(_me.Id);
        var category = _db.AddCategory(_me.Id, "Lazer");
        _db.AddTransaction(account, category, 1000, DateTime.UtcNow, "   ");
        _db.AddTransaction(account, category, 1000, DateTime.UtcNow, "Padaria Real");
        _db.AddTransaction(account, category, 1000, DateTime.UtcNow, "Cinemark");
        _db.ChangeTracker.Clear();
        CatalogTransactionsHandler Handler() => new(new TransactionRepository(_db), new MerchantRepository(_db), new UserRepository(_db), TestRules.Provider);

        var first = await Handler().Handle(new CatalogTransactionsCommand(Max: 2));
        var second = await Handler().Handle(new CatalogTransactionsCommand());
        var third = await Handler().Handle(new CatalogTransactionsCommand());

        Assert.Equal((1, 1, 0), (first, second, third));
        _db.ChangeTracker.Clear();
        Assert.All(_db.Transactions, t => Assert.NotNull(t.CatalogAttemptedAt));
        Assert.Single(_db.Transactions, t => t.MerchantId == null);
        Assert.Empty(await new TransactionRepository(_db).GetUncataloguedAsync(10));
    }

    [Fact]
    public async Task Deleting_every_transaction_runs_as_one_statement_with_one_history_entry()
    {
        var account = _db.AddAccount(_me.Id);
        var category = _db.AddCategory(_me.Id, "Lazer");
        for (var i = 0; i < 3; i++) _db.AddTransaction(account, category, 1000, DateTime.UtcNow, $"T{i}");
        var other = _db.AddUser("Bia Souza");
        _db.AddTransaction(_db.AddAccount(other.Id), _db.AddCategory(other.Id, "Lazer"), 500, DateTime.UtcNow, "Dela");
        _db.ChangeTracker.Clear();
        var repository = new TransactionRepository(_db);

        Assert.Equal(3, await repository.DeleteByUserIdAsync(_me.Id));
        Assert.Equal(0, await repository.DeleteByUserIdAsync(_me.Id));
        Assert.Equal(1, await repository.DeleteByUserIdAsync(other.Id));

        Assert.Equal(0, _db.Transactions.Count());
        Assert.Contains(_db.ActivityLogs, a => a.UserId == _me.Id && a.Description == "3 transações excluídas de uma vez" && a.Type == ActivityType.WARNING);
        Assert.Contains(_db.ActivityLogs, a => a.UserId == other.Id && a.Description == "1 transação excluída");
    }

    [Fact]
    public void Each_user_has_at_most_one_system_folder()
    {
        _db.Folders.Add(new Folder { UserId = _me.Id, Name = Folder.ImportsFolderName, IsSystem = true });
        _db.Folders.Add(new Folder { UserId = _me.Id, Name = "Notas" });
        _db.Folders.Add(new Folder { UserId = _me.Id, Name = "Mais notas" });
        _db.SaveChanges();

        _db.Folders.Add(new Folder { UserId = _me.Id, Name = Folder.ImportsFolderName, IsSystem = true });

        var error = Assert.Throws<DbUpdateException>(() => _db.SaveChanges());
        Assert.True(DbErrors.IsUniqueViolation(error));
    }

    [Fact]
    public async Task Names_longer_than_the_limit_are_refused_by_the_database_too()
    {
        var model = _db.Model;

        Assert.Equal(100, model.FindEntityType(typeof(Account))!.FindProperty(nameof(Account.Name))!.GetMaxLength());
        Assert.Equal(100, model.FindEntityType(typeof(Category))!.FindProperty(nameof(Category.Name))!.GetMaxLength());
        Assert.Equal(7, model.FindEntityType(typeof(Category))!.FindProperty(nameof(Category.Color))!.GetMaxLength());
        Assert.Equal(100, model.FindEntityType(typeof(Goal))!.FindProperty(nameof(Goal.Name))!.GetMaxLength());
        Assert.True(model.FindEntityType(typeof(Account))!.FindProperty(nameof(Account.Version))!.IsConcurrencyToken);
        await Task.CompletedTask;
    }

    private sealed class SaveCounter : SaveChangesInterceptor
    {
        public int Count { get; set; }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            Count++;
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}

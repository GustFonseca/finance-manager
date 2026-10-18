using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Tests.Infrastructure;

public sealed class RepositoryTests : IDisposable
{
    private static readonly DateTime Day = new(2026, 10, 10, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly User _me;

    public RepositoryTests()
    {
        (_db, _connection) = TestDb.Sqlite();
        _me = _db.AddUser();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Users_are_found_by_google_id()
    {
        var repository = new UserRepository(_db);

        Assert.Equal(_me.Id, (await repository.GetByGoogleIdAsync(_me.GoogleId))!.Id);
        Assert.Null(await repository.GetByGoogleIdAsync("desconhecido"));
    }

    [Fact]
    public async Task Only_active_classification_rules_are_loaded_in_type_and_priority_order()
    {
        var rule = _db.ClassificationRules.OrderBy(r => r.Priority).First();
        rule.IsActive = false;
        _db.SaveChanges();

        var rules = await new ClassificationRuleRepository(_db).GetActiveAsync();

        Assert.Equal(41, rules.Count);
        Assert.DoesNotContain(rules, r => r.Id == rule.Id);
        Assert.Equal(rules.OrderBy(r => r.Type.ToString()).ThenBy(r => r.Priority).Select(r => r.Id), rules.Select(r => r.Id));
    }

    [Fact]
    public async Task Transactions_are_filtered_and_loaded_with_their_relations()
    {
        var nubank = _db.AddAccount(_me.Id, "Nubank");
        var itau = _db.AddAccount(_me.Id, "Itaú");
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        var merchant = new Merchant { UserId = _me.Id, Name = "Cinemark", Key = "cinemark" };
        _db.Merchants.Add(merchant);
        _db.SaveChanges();
        var catalogued = _db.AddTransaction(nubank, lazer, 100, Day, "Cinemark", merchant);
        var loose = _db.AddTransaction(itau, lazer, 200, Day.AddDays(-3), "Teatro");
        _db.AddTransaction(nubank, lazer, 300, Day.AddDays(-40), "Antiga");
        _db.ChangeTracker.Clear();
        var repository = new TransactionRepository(_db);

        var period = await repository.GetByUserIdAsync(_me.Id, Day.AddDays(-7), Day);
        var byAccount = await repository.GetByUserIdAsync(_me.Id, null, null, itau.Id);
        var byMerchant = await repository.GetByUserIdAsync(_me.Id, null, null, merchantId: merchant.Id);

        Assert.Equal([catalogued.Id, loose.Id], period.Select(t => t.Id));
        Assert.Equal(("Nubank", "Lazer", "Cinemark"), (period[0].Account.Name, period[0].Category.Name, period[0].Merchant!.Name));
        Assert.Equal([loose.Id], byAccount.Select(t => t.Id));
        Assert.Equal([catalogued.Id], byMerchant.Select(t => t.Id));
        Assert.Equal([catalogued.Id], (await repository.GetByMerchantIdAsync(merchant.Id)).Select(t => t.Id));
        Assert.Equal(2, (await repository.GetUncataloguedAsync()).Count);
        Assert.True(await repository.ExistsForAccountAsync(itau.Id));
        Assert.False(await repository.ExistsForAccountAsync(Guid.NewGuid()));
        Assert.True(await repository.ExistsForCategoryAsync(lazer.Id));
        Assert.False(await repository.ExistsForCategoryAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task Transactions_are_created_updated_and_deleted_in_bulk()
    {
        var account = _db.AddAccount(_me.Id);
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        var repository = new TransactionRepository(_db);
        var batch = Enumerable.Range(1, 3)
            .Select(i => new Transaction { UserId = _me.Id, AccountId = account.Id, CategoryId = lazer.Id, AmountCents = i * 100, Description = $"T{i}", Date = Day, Type = TransactionType.EXPENSE })
            .ToList();

        await repository.CreateRangeAsync(batch);
        batch.ForEach(t => t.Description += " editada");
        await repository.UpdateRangeAsync(batch);

        Assert.All(_db.Transactions.AsNoTracking(), t => Assert.EndsWith(" editada", t.Description));
        Assert.Equal(3, await repository.DeleteByUserIdAsync(_me.Id));
        Assert.Equal(0, await repository.DeleteByUserIdAsync(_me.Id));
        Assert.Empty(_db.Transactions);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "3 transações importadas de uma vez");
        Assert.Contains(_db.ActivityLogs, a => a.Description == "3 transações alteradas de uma vez");
    }

    [Fact]
    public async Task An_account_with_transactions_cannot_be_deleted_at_the_database_level()
    {
        var account = _db.AddAccount(_me.Id);
        _db.AddTransaction(account, _db.AddCategory(_me.Id, "Lazer"), 100, Day);
        _db.ChangeTracker.Clear();
        var repository = new AccountRepository(_db);

        await Assert.ThrowsAsync<DbUpdateException>(async () => await repository.DeleteAsync((await repository.GetByIdAsync(account.Id))!));
    }

    [Fact]
    public async Task Budgets_savings_plans_and_goals_are_scoped_to_the_user()
    {
        var other = _db.AddUser("Outra pessoa");
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        var theirs = _db.AddCategory(other.Id, "Lazer");
        _db.CategoryBudgets.AddRange(
            new CategoryBudget { UserId = _me.Id, CategoryId = lazer.Id, LimitCents = 100 },
            new CategoryBudget { UserId = other.Id, CategoryId = theirs.Id, LimitCents = 200 });
        _db.SavingsPlans.Add(new SavingsPlan { UserId = other.Id, MonthlyGoalCents = 300 });
        _db.Goals.AddRange(
            new Goal { UserId = _me.Id, Name = "Antiga", CreatedAt = Day.AddDays(-1) },
            new Goal { UserId = _me.Id, Name = "Nova", CreatedAt = Day },
            new Goal { UserId = other.Id, Name = "Alheia" });
        _db.SaveChanges();
        var budgets = new CategoryBudgetRepository(_db);

        Assert.Equal([100L], (await budgets.GetByUserIdAsync(_me.Id)).Select(b => b.LimitCents));
        Assert.Equal(100, (await budgets.GetByCategoryIdAsync(_me.Id, lazer.Id))!.LimitCents);
        Assert.Null(await budgets.GetByCategoryIdAsync(_me.Id, theirs.Id));
        Assert.Null(await new SavingsPlanRepository(_db).GetByUserIdAsync(_me.Id));
        Assert.Equal(300, (await new SavingsPlanRepository(_db).GetByUserIdAsync(other.Id))!.MonthlyGoalCents);
        Assert.Equal(["Nova", "Antiga"], (await new GoalRepository(_db).GetByUserIdAsync(_me.Id)).Select(g => g.Name));
    }

    [Fact]
    public async Task Merchants_are_found_by_key_with_their_category()
    {
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        _db.Merchants.AddRange(
            new Merchant { UserId = _me.Id, Name = "Uber", Key = "uber" },
            new Merchant { UserId = _me.Id, Name = "Cinemark", Key = "cinemark", CategoryId = lazer.Id });
        _db.SaveChanges();
        _db.ChangeTracker.Clear();
        var repository = new MerchantRepository(_db);

        Assert.Equal(["Cinemark", "Uber"], (await repository.GetByUserIdAsync(_me.Id)).Select(m => m.Name));
        Assert.Equal("Lazer", (await repository.GetByKeyAsync(_me.Id, "cinemark"))!.Category!.Name);
        Assert.Null(await repository.GetByKeyAsync(Guid.NewGuid(), "cinemark"));
    }

    [Fact]
    public async Task Folders_and_files_follow_the_trash_rules()
    {
        var folders = new FolderRepository(_db);
        var files = new StoredFileRepository(_db);
        var system = await folders.CreateAsync(new Folder { UserId = _me.Id, Name = Folder.ImportsFolderName, IsSystem = true, CreatedAt = Day });
        var kept = await folders.CreateAsync(new Folder { UserId = _me.Id, Name = "Mantida", CreatedAt = Day.AddDays(-1) });
        var trashed = await folders.CreateAsync(new Folder { UserId = _me.Id, Name = "Lixo", DeletedAt = Day });
        await files.CreateAsync(new StoredFile { UserId = _me.Id, FolderId = kept.Id, Name = "b.pdf", StorageKey = "k1" });
        await files.CreateAsync(new StoredFile { UserId = _me.Id, FolderId = kept.Id, Name = "a.pdf", StorageKey = "k2" });
        await files.CreateAsync(new StoredFile { UserId = _me.Id, FolderId = kept.Id, Name = "solto.pdf", StorageKey = "k3", DeletedAt = Day });
        await files.CreateAsync(new StoredFile { UserId = _me.Id, FolderId = trashed.Id, Name = "dentro.pdf", StorageKey = "k4", DeletedAt = Day });

        Assert.Equal([system.Id, kept.Id], (await folders.GetByUserIdAsync(_me.Id, deleted: false)).Select(f => f.Id));
        Assert.Equal([trashed.Id], (await folders.GetByUserIdAsync(_me.Id, deleted: true)).Select(f => f.Id));
        Assert.Equal(system.Id, (await folders.GetSystemFolderAsync(_me.Id))!.Id);
        Assert.Equal(["a.pdf", "b.pdf", "solto.pdf"], (await files.GetByFolderIdAsync(kept.Id)).Select(f => f.Name));
        Assert.Equal(["solto.pdf"], (await files.GetTrashedAsync(_me.Id)).Select(f => f.Name));
        Assert.Equal(new Dictionary<Guid, int> { [kept.Id] = 2 }, await files.CountActiveByFolderAsync(_me.Id));

        await files.DeleteRangeAsync(await files.GetByFolderIdAsync(trashed.Id));
        await folders.DeleteRangeAsync([trashed]);

        Assert.Equal(2, _db.Folders.Count());
        Assert.Equal(3, _db.Files.Count());
    }

    [Fact]
    public async Task Activity_is_paged_newest_first()
    {
        _db.ActivityLogs.AddRange(Enumerable.Range(0, 4).Select(i => new ActivityLog { UserId = _me.Id, Description = $"E{i}", CreatedAt = Day.AddMinutes(i) }));
        _db.SaveChanges();
        var repository = new ActivityLogRepository(_db);

        Assert.Equal(["E3", "E2"], (await repository.GetByUserIdAsync(_me.Id, null, 2)).Select(a => a.Description));
        Assert.Equal(["E1", "E0"], (await repository.GetByUserIdAsync(_me.Id, Day.AddMinutes(2), 10)).Select(a => a.Description));
    }
}

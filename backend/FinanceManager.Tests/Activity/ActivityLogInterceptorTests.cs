using FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;
using FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Files;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Tests.Activity;

/// <summary>The history written by the EF interceptor, through the real repositories.</summary>
public class ActivityLogInterceptorTests
{
    private static readonly Guid Me = Guid.NewGuid();

    private readonly AppDbContext _db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .AddInterceptors(new ActivityLogInterceptor())
        .Options);

    private List<ActivityLog> History() => _db.ActivityLogs.OrderBy(a => a.CreatedAt).ToList();

    [Fact]
    public async Task Creating_and_deleting_a_transaction_is_logged_with_its_amount()
    {
        var repository = new TransactionRepository(_db);
        var transaction = new Transaction
        {
            UserId = Me,
            Description = "iFood",
            Type = TransactionType.EXPENSE,
            AmountCents = 4590,
        };

        await repository.CreateAsync(transaction);
        await repository.DeleteAsync(transaction);

        var history = History();
        Assert.Equal(2, history.Count);
        Assert.StartsWith("Transação criada: iFood (- R$", history[0].Description);
        Assert.Contains("45,90", history[0].Description);
        Assert.Equal(ActivityType.WARNING, history[1].Type);
        Assert.StartsWith("Transação excluída: iFood", history[1].Description);
        Assert.All(history, a => Assert.Equal(Me, a.UserId));
    }

    [Fact]
    public async Task Balance_changes_are_not_logged_but_renames_are()
    {
        var repository = new AccountRepository(_db);
        var account = new Account(Me, "Nubank");
        await repository.CreateAsync(account);

        account.SubtractBalance(1000);
        await repository.UpdateAsync(account);
        account.UpdateName("Nubank PF");
        await repository.UpdateAsync(account);

        Assert.Equal(["Conta criada: Nubank", "Conta renomeada: Nubank → Nubank PF"], History().Select(a => a.Description));
    }

    [Fact]
    public async Task The_auto_created_imports_folder_is_not_logged()
    {
        await new FolderRepository(_db).CreateAsync(new Folder { UserId = Me, Name = Folder.ImportsFolderName, IsSystem = true });

        Assert.Empty(History());
    }

    [Fact]
    public async Task Trashing_and_restoring_a_folder_is_one_entry_each_not_one_per_file()
    {
        var folders = new FolderRepository(_db);
        var files = new StoredFileRepository(_db);
        var folder = await folders.CreateAsync(new Folder { UserId = Me, Name = "Notas" });
        await files.CreateAsync(new StoredFile { UserId = Me, FolderId = folder.Id, Name = "a.pdf", SizeBytes = 2048, StorageKey = "k1" });
        await files.CreateAsync(new StoredFile { UserId = Me, FolderId = folder.Id, Name = "b.pdf", SizeBytes = 10, StorageKey = "k2" });

        await new TrashFolderHandler(folders, files).Handle(new TrashFolderCommand(Me, folder.Id));
        await new RestoreFolderHandler(folders, files).Handle(new RestoreFolderCommand(Me, folder.Id));

        Assert.Equal(
            [
                "Pasta criada: Notas",
                "Arquivo enviado para Notas: a.pdf (2 KB)",
                "Arquivo enviado para Notas: b.pdf (10 bytes)",
                "Pasta enviada para a Lixeira: Notas",
                "Pasta restaurada da Lixeira: Notas",
            ],
            History().Select(a => a.Description));
    }

    [Fact]
    public async Task Emptying_the_trash_logs_the_folder_once_and_loose_files_individually()
    {
        var folders = new FolderRepository(_db);
        var files = new StoredFileRepository(_db);
        var trashed = await folders.CreateAsync(new Folder { UserId = Me, Name = "Velha" });
        await files.CreateAsync(new StoredFile { UserId = Me, FolderId = trashed.Id, Name = "dentro.pdf", StorageKey = "k1" });
        var kept = await folders.CreateAsync(new Folder { UserId = Me, Name = "Mantida" });
        var loose = await files.CreateAsync(new StoredFile { UserId = Me, FolderId = kept.Id, Name = "solto.pdf", StorageKey = "k2" });
        await new TrashFolderHandler(folders, files).Handle(new TrashFolderCommand(Me, trashed.Id));
        loose.DeletedAt = DateTime.UtcNow;
        await files.UpdateAsync(loose);
        var before = History().Count;

        await new EmptyTrashHandler(folders, files, new FakeStore().Storage).Handle(new EmptyTrashCommand(Me));

        Assert.Equal(
            ["Arquivo excluído permanentemente: solto.pdf", "Pasta excluída permanentemente: Velha"],
            History().Skip(before).Select(a => a.Description).OrderBy(d => d));
    }

    [Fact]
    public async Task Deleting_all_transactions_is_one_entry_and_zeroes_the_balances()
    {
        var transactions = new TransactionRepository(_db);
        var accounts = new AccountRepository(_db);
        var account = new Account(Me, "Nubank");
        await accounts.CreateAsync(account);
        account.SubtractBalance(5000);
        await accounts.UpdateAsync(account);
        foreach (var description in new[] { "iFood", "Uber", "Mercado" })
            await transactions.CreateAsync(new Transaction { UserId = Me, AccountId = account.Id, Description = description, Type = TransactionType.EXPENSE, AmountCents = 1000 });
        await transactions.CreateAsync(new Transaction { UserId = Guid.NewGuid(), Description = "De outra pessoa", Type = TransactionType.EXPENSE, AmountCents = 1000 });
        var before = History().Count;

        var deleted = await new DeleteAllTransactionsHandler(transactions, accounts).Handle(new DeleteAllTransactionsCommand(Me));

        Assert.Equal(3, deleted);
        Assert.Equal(1, _db.Transactions.Count());
        Assert.Equal(0, (await accounts.GetByIdAsync(account.Id))!.BalanceCents);
        Assert.Equal(["3 transações excluídas de uma vez"], History().Skip(before).Select(a => a.Description));
    }
}

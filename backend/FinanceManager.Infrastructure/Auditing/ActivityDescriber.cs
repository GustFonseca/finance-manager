using System.Globalization;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinanceManager.Infrastructure.Auditing;

/// <summary>
/// Turns a pending entity change into the user's activity history, in plain
/// Portuguese. Changes that mean nothing to the user (an account balance moved
/// by a transaction, the auto-created imports folder) produce no entry.
/// </summary>
public static class ActivityDescriber
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    public static IEnumerable<ActivityLog> Describe(EntityEntry entry, DbContext context) => entry.Entity switch
    {
        Transaction transaction => DescribeTransaction(entry, transaction),
        Account account => DescribeAccount(entry, account),
        Category category => DescribeCategory(entry, category),
        Goal goal => DescribeGoal(entry, goal),
        Folder folder => DescribeFolder(entry, folder),
        StoredFile file => DescribeFile(entry, file, context),
        _ => [],
    };

    private static IEnumerable<ActivityLog> DescribeTransaction(EntityEntry entry, Transaction t)
    {
        var label = string.IsNullOrWhiteSpace(t.Description) ? "(sem descrição)" : t.Description;
        var amount = Money(t.Type == TransactionType.EXPENSE ? -t.AmountCents : t.AmountCents, signed: true);
        if (entry.State == EntityState.Added)
            yield return Log(t.UserId, "Transações", $"Transação criada: {label} ({amount})");
        else if (entry.State == EntityState.Deleted)
            yield return Log(t.UserId, "Transações", $"Transação excluída: {label} ({amount})", ActivityType.WARNING);
    }

    private static IEnumerable<ActivityLog> DescribeAccount(EntityEntry entry, Account a)
    {
        switch (entry.State)
        {
            case EntityState.Added:
                yield return Log(a.UserId, "Contas", $"Conta criada: {a.Name}");
                break;
            // Balance changes come from transactions, which are logged on their own.
            case EntityState.Modified when Changed(entry, nameof(Account.Name)):
                yield return Log(a.UserId, "Contas", $"Conta renomeada: {Original<string>(entry, nameof(Account.Name))} → {a.Name}");
                break;
            case EntityState.Deleted:
                yield return Log(a.UserId, "Contas", $"Conta excluída: {a.Name}", ActivityType.WARNING);
                break;
        }
    }

    private static IEnumerable<ActivityLog> DescribeCategory(EntityEntry entry, Category c)
    {
        switch (entry.State)
        {
            case EntityState.Added:
                yield return Log(c.UserId, "Categorias", $"Categoria criada: {c.Name}");
                break;
            case EntityState.Modified when Changed(entry, nameof(Category.Name)):
                yield return Log(c.UserId, "Categorias", $"Categoria renomeada: {Original<string>(entry, nameof(Category.Name))} → {c.Name}");
                break;
            case EntityState.Modified when Changed(entry, nameof(Category.Type)) || Changed(entry, nameof(Category.Color)):
                yield return Log(c.UserId, "Categorias", $"Categoria alterada: {c.Name}");
                break;
            case EntityState.Deleted:
                yield return Log(c.UserId, "Categorias", $"Categoria excluída: {c.Name}", ActivityType.WARNING);
                break;
        }
    }

    private static IEnumerable<ActivityLog> DescribeGoal(EntityEntry entry, Goal g)
    {
        switch (entry.State)
        {
            case EntityState.Added:
                yield return Log(g.UserId, "Metas", $"Meta criada: {g.Name} (alvo {Money(g.TargetCents)})");
                break;
            case EntityState.Modified:
                if (Changed(entry, nameof(Goal.CurrentCents)))
                {
                    var added = g.CurrentCents - Original<long>(entry, nameof(Goal.CurrentCents));
                    yield return Log(g.UserId, "Metas",
                        $"Valor adicionado à meta {g.Name}: {Money(added)} ({Money(g.CurrentCents)} de {Money(g.TargetCents)})");
                }
                if (Changed(entry, nameof(Goal.Status)) && g.Status == GoalStatus.COMPLETED)
                    yield return Log(g.UserId, "Metas", $"Meta concluída: {g.Name}");
                break;
            case EntityState.Deleted:
                yield return Log(g.UserId, "Metas", $"Meta excluída: {g.Name}", ActivityType.WARNING);
                break;
        }
    }

    private static IEnumerable<ActivityLog> DescribeFolder(EntityEntry entry, Folder f)
    {
        switch (entry.State)
        {
            // The imports folder is created by the app, not by the user.
            case EntityState.Added when !f.IsSystem:
                yield return Log(f.UserId, "Arquivos", $"Pasta criada: {f.Name}");
                break;
            case EntityState.Modified:
                if (Changed(entry, nameof(Folder.Name)))
                    yield return Log(f.UserId, "Arquivos", $"Pasta renomeada: {Original<string>(entry, nameof(Folder.Name))} → {f.Name}");
                if (Changed(entry, nameof(Folder.DeletedAt)))
                {
                    yield return f.DeletedAt != null
                        ? Log(f.UserId, "Arquivos", $"Pasta enviada para a Lixeira: {f.Name}", ActivityType.WARNING)
                        : Log(f.UserId, "Arquivos", $"Pasta restaurada da Lixeira: {f.Name}");
                }
                break;
            case EntityState.Deleted:
                yield return Log(f.UserId, "Arquivos", $"Pasta excluída permanentemente: {f.Name}", ActivityType.WARNING);
                break;
        }
    }

    private static IEnumerable<ActivityLog> DescribeFile(EntityEntry entry, StoredFile file, DbContext context)
    {
        var folder = TrackedFolder(context, file.FolderId);
        switch (entry.State)
        {
            case EntityState.Added:
                var into = folder != null ? $" para {folder.Name}" : "";
                yield return Log(file.UserId, "Arquivos", $"Arquivo enviado{into}: {file.Name} ({Size(file.SizeBytes)})");
                break;
            case EntityState.Modified:
                if (Changed(entry, nameof(StoredFile.FolderId)))
                    yield return Log(file.UserId, "Arquivos", $"Arquivo movido para {folder?.Name ?? "outra pasta"}: {file.Name}");
                if (Changed(entry, nameof(StoredFile.Name)))
                    yield return Log(file.UserId, "Arquivos", $"Arquivo renomeado: {Original<string>(entry, nameof(StoredFile.Name))} → {file.Name}");
                if (Changed(entry, nameof(StoredFile.DeletedAt)) && !MovesWithFolder(entry, file, context))
                {
                    yield return file.DeletedAt != null
                        ? Log(file.UserId, "Arquivos", $"Arquivo enviado para a Lixeira: {file.Name}", ActivityType.WARNING)
                        : Log(file.UserId, "Arquivos", $"Arquivo restaurado da Lixeira: {file.Name}");
                }
                break;
            // Files of a folder in the trash go with the folder's own entry.
            case EntityState.Deleted when folder?.DeletedAt == null:
                yield return Log(file.UserId, "Arquivos", $"Arquivo excluído permanentemente: {file.Name}", ActivityType.WARNING);
                break;
        }
    }

    /// <summary>
    /// True when the file goes to (or comes back from) the trash together with
    /// its folder: they share the folder's timestamp, and the folder logs it once.
    /// </summary>
    private static bool MovesWithFolder(EntityEntry entry, StoredFile file, DbContext context)
    {
        var folderEntry = context.ChangeTracker.Entries<Folder>().FirstOrDefault(e => e.Entity.Id == file.FolderId);
        if (folderEntry == null) return false;
        var stamp = file.DeletedAt ?? Original<DateTime?>(entry, nameof(StoredFile.DeletedAt));
        var folderStamps = new[]
        {
            folderEntry.Entity.DeletedAt,
            (DateTime?)folderEntry.Property(nameof(Folder.DeletedAt)).OriginalValue,
        };
        return stamp != null && folderStamps.Contains(stamp);
    }

    private static Folder? TrackedFolder(DbContext context, Guid folderId) =>
        context.ChangeTracker.Entries<Folder>().FirstOrDefault(e => e.Entity.Id == folderId)?.Entity;

    private static bool Changed(EntityEntry entry, string property)
    {
        var p = entry.Property(property);
        return !Equals(p.OriginalValue, p.CurrentValue);
    }

    private static T Original<T>(EntityEntry entry, string property) => (T)entry.Property(property).OriginalValue!;

    private static ActivityLog Log(Guid userId, string source, string description, ActivityType type = ActivityType.INFO) =>
        new() { UserId = userId, Source = source, Description = description, Type = type };

    private static string Money(long cents, bool signed = false)
    {
        var text = (Math.Abs(cents) / 100m).ToString("C", PtBr);
        if (!signed) return text;
        return cents < 0 ? $"- {text}" : $"+ {text}";
    }

    private static string Size(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} bytes",
        < 1024 * 1024 => $"{(bytes / 1024d).ToString("0.#", PtBr)} KB",
        _ => $"{(bytes / 1024d / 1024d).ToString("0.#", PtBr)} MB",
    };
}

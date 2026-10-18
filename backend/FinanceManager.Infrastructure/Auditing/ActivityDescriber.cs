using System.Globalization;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FinanceManager.Infrastructure.Auditing;

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
        SavingsPlan plan => DescribeSavingsPlan(entry, plan),
        CategoryBudget budget => DescribeBudget(entry, budget, context),
        Merchant merchant => DescribeMerchant(entry, merchant),
        _ => [],
    };

    public static ActivityLog BulkUpdate(IReadOnlyCollection<Transaction> transactions) =>
        Log(transactions.First().UserId, "Transações", $"{transactions.Count} transações alteradas de uma vez");

    public static ActivityLog BulkCreate(IReadOnlyCollection<Transaction> transactions) =>
        Log(transactions.First().UserId, "Transações", $"{transactions.Count} transações importadas de uma vez");

    public static ActivityLog BulkDelete(IReadOnlyCollection<Transaction> transactions) =>
        Log(transactions.First().UserId, "Transações", $"{transactions.Count} transações excluídas de uma vez", ActivityType.WARNING);

    private static IEnumerable<ActivityLog> DescribeTransaction(EntityEntry entry, Transaction t)
    {
        var label = string.IsNullOrWhiteSpace(t.Description) ? "(sem descrição)" : t.Description;
        var amount = Money(t.Type == TransactionType.EXPENSE ? -t.AmountCents : t.AmountCents, signed: true);
        if (entry.State == EntityState.Added)
            yield return Log(t.UserId, "Transações", $"Transação criada: {label} ({amount})");
        else if (entry.State == EntityState.Modified && EditedByUser(entry))
            yield return Log(t.UserId, "Transações", $"Transação alterada: {label} ({amount})");
        else if (entry.State == EntityState.Deleted)
            yield return Log(t.UserId, "Transações", $"Transação excluída: {label} ({amount})", ActivityType.WARNING);
    }

    private static IEnumerable<ActivityLog> DescribeMerchant(EntityEntry entry, Merchant m)
    {
        if (entry.State != EntityState.Modified) yield break;
        if (Changed(entry, nameof(Merchant.Name)))
            yield return Log(m.UserId, "Estabelecimentos", $"Estabelecimento renomeado: {Original<string>(entry, nameof(Merchant.Name))} → {m.Name}");
        else if (Changed(entry, nameof(Merchant.Kind)))
            yield return Log(m.UserId, "Estabelecimentos", $"Estabelecimento atualizado: {m.Name}");
    }

    private static readonly string[] EditableTransactionFields =
    [
        nameof(Transaction.AccountId), nameof(Transaction.CategoryId), nameof(Transaction.Type),
        nameof(Transaction.AmountCents), nameof(Transaction.Description), nameof(Transaction.Date), nameof(Transaction.Recurrence),
    ];

    private static bool EditedByUser(EntityEntry entry) => EditableTransactionFields.Any(field => Changed(entry, field));

    private static IEnumerable<ActivityLog> DescribeAccount(EntityEntry entry, Account a)
    {
        switch (entry.State)
        {
            case EntityState.Added:
                yield return Log(a.UserId, "Contas", $"Conta criada: {a.Name}");
                break;
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
            case EntityState.Deleted when folder?.DeletedAt == null:
                yield return Log(file.UserId, "Arquivos", $"Arquivo excluído permanentemente: {file.Name}", ActivityType.WARNING);
                break;
        }
    }

    private static IEnumerable<ActivityLog> DescribeSavingsPlan(EntityEntry entry, SavingsPlan plan)
    {
        var changed = entry.State == EntityState.Added
            || (entry.State == EntityState.Modified && Changed(entry, nameof(SavingsPlan.MonthlyGoalCents)));
        if (changed)
            yield return Log(plan.UserId, "Economia", $"Meta de economia definida: {Money(plan.MonthlyGoalCents)} por mês");
    }

    private static IEnumerable<ActivityLog> DescribeBudget(EntityEntry entry, CategoryBudget budget, DbContext context)
    {
        var category = context.ChangeTracker.Entries<Category>()
            .FirstOrDefault(e => e.Entity.Id == budget.CategoryId)?.Entity.Name ?? "categoria";
        switch (entry.State)
        {
            case EntityState.Added:
            case EntityState.Modified when Changed(entry, nameof(CategoryBudget.LimitCents)):
                yield return Log(budget.UserId, "Economia", $"Orçamento de {category}: {Money(budget.LimitCents)} por mês");
                break;
            case EntityState.Deleted:
                yield return Log(budget.UserId, "Economia", $"Orçamento de {category} removido");
                break;
        }
    }

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

    public const int MaxDescriptionLength = 500;

    private static ActivityLog Log(Guid userId, string source, string description, ActivityType type = ActivityType.INFO) =>
        new()
        {
            UserId = userId,
            Source = source,
            Description = description.Length <= MaxDescriptionLength ? description : description[..(MaxDescriptionLength - 1)] + "…",
            Type = type,
        };

    private static string Money(long cents, bool signed = false) => MoneyText.Format(cents, signed);

    private static string Size(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} bytes",
        < 1024 * 1024 => $"{(bytes / 1024d).ToString("0.#", PtBr)} KB",
        _ => $"{(bytes / 1024d / 1024d).ToString("0.#", PtBr)} MB",
    };
}

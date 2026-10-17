using FinanceManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FinanceManager.Infrastructure.Auditing;

/// <summary>
/// Writes the user's activity history from the changes being saved, in the
/// same SaveChanges (so history and data commit or fail together). Handlers
/// don't log anything themselves, so no action can be forgotten.
/// </summary>
public sealed class ActivityLogInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        AddActivity(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AddActivity(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void AddActivity(DbContext? context)
    {
        if (context == null) return;

        context.ChangeTracker.DetectChanges();
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        // Deleting many transactions at once (e.g. "apagar todas") is one event, not hundreds.
        var deletedTransactions = entries
            .Where(e => e.State == EntityState.Deleted && e.Entity is Transaction)
            .ToList();
        var logs = new List<ActivityLog>();
        if (deletedTransactions.Count > 1)
        {
            logs.Add(ActivityDescriber.BulkDelete(deletedTransactions.Select(e => (Transaction)e.Entity).ToList()));
            entries = entries.Except(deletedTransactions).ToList();
        }
        logs.AddRange(entries.SelectMany(e => ActivityDescriber.Describe(e, context)));

        if (logs.Count > 0) context.Set<ActivityLog>().AddRange(logs);
    }
}

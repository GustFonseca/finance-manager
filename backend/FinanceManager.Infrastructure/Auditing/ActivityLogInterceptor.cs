using FinanceManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FinanceManager.Infrastructure.Auditing;

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

        var deletedTransactions = entries
            .Where(e => e.State == EntityState.Deleted && e.Entity is Transaction)
            .ToList();
        var logs = new List<ActivityLog>();
        if (deletedTransactions.Count > 1)
        {
            logs.Add(ActivityDescriber.BulkDelete(deletedTransactions.Select(e => (Transaction)e.Entity).ToList()));
            entries = entries.Except(deletedTransactions).ToList();
        }
        var addedTransactions = entries
            .Where(e => e.State == EntityState.Added && e.Entity is Transaction)
            .ToList();
        if (addedTransactions.Count > 1)
        {
            logs.Add(ActivityDescriber.BulkCreate(addedTransactions.Select(e => (Transaction)e.Entity).ToList()));
            entries = entries.Except(addedTransactions).ToList();
        }
        logs.AddRange(entries.SelectMany(e => ActivityDescriber.Describe(e, context)));

        if (logs.Count > 0) context.Set<ActivityLog>().AddRange(logs);
    }
}

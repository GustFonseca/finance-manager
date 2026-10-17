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
        var logs = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList()
            .SelectMany(e => ActivityDescriber.Describe(e, context))
            .ToList();

        if (logs.Count > 0) context.Set<ActivityLog>().AddRange(logs);
    }
}

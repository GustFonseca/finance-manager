using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Context;

public static class DbErrors
{
    public const string UniqueViolationState = "23505";

    public static bool IsUniqueViolation(Exception exception) =>
        exception is DbUpdateException { InnerException: DbException db }
        && (db.SqlState == UniqueViolationState || db.Message.Contains("UNIQUE constraint failed", StringComparison.Ordinal));
}

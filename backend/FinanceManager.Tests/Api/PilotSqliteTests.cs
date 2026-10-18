using FinanceManager.Infrastructure.Classification;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.Api;

public class PilotSqliteTests
{
    [Fact]
    public void The_model_builds_on_sqlite_with_the_seeded_rules()
    {
        var (db, connection) = TestDb.Sqlite();
        using (connection)
        using (db)
        {
            Assert.Equal(DefaultClassificationRules.All.Count, db.ClassificationRules.Count());
        }
    }
}

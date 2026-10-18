using AutoMapper;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Tests.Support;

public static class TestDb
{
    public static AppDbContext InMemory() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(new ActivityLogInterceptor())
            .Options);

    public static (AppDbContext Db, SqliteConnection Connection) Sqlite()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .AddInterceptors(new ActivityLogInterceptor())
            .Options);
        db.Database.EnsureCreated();
        return (db, connection);
    }

    public static IMapper Mapper { get; } =
        new MapperConfiguration(cfg => cfg.AddMaps(typeof(TransactionProfile).Assembly)).CreateMapper();
}

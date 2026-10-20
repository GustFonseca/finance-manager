using FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Activity;

public class GetActivityHandlerTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime Start = new(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();

    public GetActivityHandlerTests()
    {
        for (var i = 0; i < 5; i++)
            _db.ActivityLogs.Add(new ActivityLog { UserId = Me, Source = "Contas", Description = $"Evento {i}", CreatedAt = Start.AddMinutes(i) });
        _db.ActivityLogs.Add(new ActivityLog { UserId = Guid.NewGuid(), Description = "De outra pessoa", CreatedAt = Start.AddHours(1), Type = ActivityType.WARNING });
        _db.SaveChanges();
    }

    private Task<List<Aplication.DTOs.ActivityLogDto>> Get(DateTime? before, int limit) =>
        new GetActivityHandler(new ActivityLogRepository(_db)).Handle(new GetActivityQuery(Me, before, limit));

    [Fact]
    public async Task Returns_the_users_entries_newest_first_up_to_the_limit()
    {
        var entries = await Get(null, 3);

        Assert.Equal(["Evento 4", "Evento 3", "Evento 2"], entries.Select(e => e.Description));
        Assert.All(entries, e => Assert.Equal("Contas", e.Source));
    }

    [Fact]
    public async Task Pages_with_the_before_cursor()
    {
        var entries = await Get(Start.AddMinutes(2), 50);

        Assert.Equal(["Evento 1", "Evento 0"], entries.Select(e => e.Description));
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-10, 1)]
    [InlineData(1000, 5)]
    public async Task The_limit_is_clamped(int limit, int expected)
    {
        var entries = await Get(null, limit);

        Assert.Equal(expected, entries.Count);
    }
}

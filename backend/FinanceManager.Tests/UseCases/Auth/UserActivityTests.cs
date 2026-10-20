using System.Security.Claims;
using FinanceManager.Api.Activity;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.UseCases.Auth.Commands.RecordUserActivity;
using FinanceManager.Aplication.UseCases.Auth.Queries.GetUsersOverview;
using FinanceManager.Aplication.UseCases.Profile.Queries.GetProfile;
using FinanceManager.Infrastructure.Auth;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceManager.Tests.UseCases.Auth;

public class UserActivityTests
{
    private static readonly DateTime Now = new(2026, 10, 19, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();

    [Fact]
    public async Task Activity_is_recorded_at_most_once_an_hour()
    {
        var me = _db.AddUser();
        var handler = new RecordUserActivityHandler(new UserRepository(_db));

        Assert.True(await handler.Handle(new RecordUserActivityCommand(me.Id, Now)));
        Assert.False(await handler.Handle(new RecordUserActivityCommand(me.Id, Now.AddMinutes(59))));
        Assert.True(await handler.Handle(new RecordUserActivityCommand(me.Id, Now.AddHours(1))));
        Assert.False(await handler.Handle(new RecordUserActivityCommand(Guid.NewGuid(), Now)));

        Assert.Equal(Now.AddHours(1), _db.Users.Single().LastSeenAt);
        Assert.Empty(_db.ActivityLogs);
    }

    [Fact]
    public async Task The_overview_lists_users_by_recent_activity_with_their_transactions()
    {
        var active = _db.AddUser("Ana");
        active.LastSeenAt = Now.AddDays(-2);
        active.LastLoginAt = Now.AddDays(-10);
        active.LoginCount = 3;
        var idle = _db.AddUser(" ");
        idle.LastSeenAt = Now.AddDays(-20);
        var never = _db.AddUser("Nunca");
        never.CreatedAt = Now.AddDays(-30);
        _db.SaveChanges();
        var account = _db.AddAccount(active.Id);
        var category = _db.AddCategory(active.Id, "Lazer");
        _db.AddTransaction(account, category, 100, Now, "Cafe");
        _db.AddTransaction(account, category, 100, Now, "Cafe");

        var list = await new GetUsersOverviewHandler(new UserRepository(_db)).Handle(new GetUsersOverviewQuery(Now));

        var first = list.Single(u => u.Id == active.Id);
        Assert.Equal((2, 3, true, (DateTime?)Now.AddDays(-10)), (first.TransactionCount, first.LoginCount, first.ActiveLast7Days, first.LastLoginAt));
        Assert.Equal(active.Id, list[0].Id);
        var idleRow = list.Single(u => u.Id == idle.Id);
        Assert.Equal((idle.Email, false), (idleRow.Name, idleRow.ActiveLast7Days));
        Assert.False(list.Single(u => u.Id == never.Id).ActiveLast7Days);
    }

    [Fact]
    public async Task The_profile_shows_the_login_and_activity_data()
    {
        var me = _db.AddUser();
        me.LastLoginAt = Now;
        me.LastSeenAt = Now.AddHours(2);
        me.LoginCount = 4;
        _db.SaveChanges();
        var admins = new ConfigAdminDirectory(new ConfigurationBuilder().Build());

        var profile = await new GetProfileHandler(new UserRepository(_db), admins).Handle(new GetProfileQuery(me.Id));

        Assert.Equal((Now, Now.AddHours(2), 4), (profile!.LastLoginAt!.Value, profile.LastSeenAt!.Value, profile.LoginCount));
    }

    [Fact]
    public async Task The_admin_endpoint_returns_the_overview()
    {
        var mediator = new FakeMediator();
        var list = new List<UserOverviewDto>();
        mediator.Returns<GetUsersOverviewQuery>(_ => list);

        var result = await new AdminController(mediator).GetUsers();

        Assert.Same(list, Assert.IsType<OkObjectResult>(result.Result).Value);
    }

    [Fact]
    public async Task The_middleware_records_activity_once_per_window_and_never_breaks_the_request()
    {
        var mediator = new FakeMediator();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var calls = 0;
        var middleware = new UserActivityTracking(_ => { calls++; return Task.CompletedTask; }, cache, NullLogger<UserActivityTracking>.Instance);
        var userId = Guid.NewGuid();
        HttpContext Signed(string? id) => new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(id == null ? [] : [new Claim(ClaimTypes.NameIdentifier, id)], "test")),
        };

        await middleware.InvokeAsync(Signed(userId.ToString()), mediator);
        await middleware.InvokeAsync(Signed(userId.ToString()), mediator);
        await middleware.InvokeAsync(Signed(null), mediator);
        await middleware.InvokeAsync(Signed("nao-e-guid"), mediator);

        Assert.Equal(4, calls);
        var sent = Assert.IsType<RecordUserActivityCommand>(Assert.Single(mediator.Sent));
        Assert.Equal(userId, sent.UserId);

        var failing = new FakeMediator().Throws<RecordUserActivityCommand>(new InvalidOperationException("db"));
        await middleware.InvokeAsync(Signed(Guid.NewGuid().ToString()), failing);
        Assert.Equal(5, calls);
    }
}

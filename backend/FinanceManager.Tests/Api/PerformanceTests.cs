using System.Net;
using System.Security.Claims;
using System.Text.Encodings.Web;
using FinanceManager.Api.Caching;
using FinanceManager.Api.Health;
using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceManager.Tests.Api;

public class ClassificationCacheTests
{
    [Fact]
    public void Lookups_are_cached_per_text_and_the_cache_is_reset_when_full()
    {
        var rules = new ClassificationRules(FinanceManager.Infrastructure.Classification.DefaultClassificationRules.All);

        Assert.True(rules.IsBill("Claro Internet"));
        Assert.True(rules.IsBill("Claro Internet"));
        Assert.False(rules.IsBill("Padaria"));
        Assert.Equal(2, rules.CachedLookups);
        Assert.Equal("IOF", rules.Fee("IOF compra"));

        for (var i = 0; i < ClassificationRules.MaxCachedLookups; i++) rules.IsBill($"x{i}");

        Assert.True(rules.CachedLookups <= ClassificationRules.MaxCachedLookups);
        Assert.False(rules.IsBill("Padaria"));
    }

    [Fact]
    public void Types_without_rules_are_not_cached()
    {
        var rules = new ClassificationRules([]);

        Assert.False(rules.IsBill("Claro"));
        Assert.Equal(0, rules.CachedLookups);
    }
}

public sealed class TransactionLimitTests : IDisposable
{
    private readonly FinanceManager.Infrastructure.Context.AppDbContext _db;
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;

    public TransactionLimitTests()
    {
        (_db, _connection) = TestDb.Sqlite();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task The_most_recent_transactions_come_first_and_the_limit_is_applied_without_tracking()
    {
        var me = _db.AddUser();
        var account = _db.AddAccount(me.Id);
        var category = _db.AddCategory(me.Id, "Lazer");
        for (var day = 1; day <= 8; day++)
            _db.AddTransaction(account, category, day * 100, new DateTime(2026, 10, day, 12, 0, 0, DateTimeKind.Utc), $"Compra {day}");
        _db.ChangeTracker.Clear();

        var repository = new TransactionRepository(_db);
        var recent = await repository.SearchAsync(me.Id, new TransactionFilter(Limit: 3));
        var all = await repository.SearchAsync(me.Id, new TransactionFilter(Limit: 0));

        Assert.Equal(["Compra 8", "Compra 7", "Compra 6"], recent.Select(t => t.Description));
        Assert.Equal(8, all.Count);
        Assert.Empty(_db.ChangeTracker.Entries<Transaction>());
        Assert.Equal("Lazer", recent[0].Category.Name);
    }
}

public sealed class OutputCacheTests : IAsyncDisposable
{
    private const string UserHeader = "X-Test-User";

    private readonly IHost _host;
    private readonly HttpClient _client;
    private int _calls;

    public OutputCacheTests()
    {
        _host = new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices(services =>
                {
                    services.AddRouting();
                    services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, HeaderAuth>("test", _ => { });
                    services.AddAuthorization();
                    services.AddOutputCache(options => options.AddPolicy(UserDataCachePolicy.Name, new UserDataCachePolicy()));
                })
                .Configure(app =>
                {
                    app.UseRouting();
                    app.UseAuthentication();
                    app.UseAuthorization();
                    app.UseMiddleware<UserCacheEviction>();
                    app.UseOutputCache();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapGet("/data", () => Results.Ok(Interlocked.Increment(ref _calls))).CacheOutput(UserDataCachePolicy.Name);
                        endpoints.MapGet("/missing", () => { Interlocked.Increment(ref _calls); return Results.NotFound(); }).CacheOutput(UserDataCachePolicy.Name);
                        endpoints.MapPost("/data", () => Results.NoContent());
                        endpoints.MapPost("/fail", () => Results.BadRequest());
                    });
                }))
            .Start();
        _client = _host.GetTestClient();
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _host.StopAsync();
        _host.Dispose();
    }

    private Task<string> Get(string user, string path = "/data")
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (user != "") request.Headers.Add(UserHeader, user);
        return _client.SendAsync(request).ContinueWith(t => t.Result.Content.ReadAsStringAsync()).Unwrap();
    }

    private async Task<HttpStatusCode> Post(string user, string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path);
        request.Headers.Add(UserHeader, user);
        return (await _client.SendAsync(request)).StatusCode;
    }

    [Fact]
    public async Task Responses_are_cached_per_user_and_query()
    {
        Assert.Equal("1", await Get("ana"));
        Assert.Equal("1", await Get("ana"));
        Assert.Equal("2", await Get("bia"));
        Assert.Equal("3", await Get("ana", "/data?month=9"));
        Assert.Equal(3, _calls);
    }

    [Fact]
    public async Task A_successful_change_clears_only_that_users_cache()
    {
        await Get("ana");
        await Get("bia");

        Assert.Equal(HttpStatusCode.BadRequest, await Post("ana", "/fail"));
        Assert.Equal("1", await Get("ana"));
        Assert.Equal(HttpStatusCode.NoContent, await Post("ana", "/data"));

        Assert.Equal("3", await Get("ana"));
        Assert.Equal("2", await Get("bia"));
    }

    [Fact]
    public async Task Anonymous_requests_and_errors_are_never_cached()
    {
        await Get("");
        await Get("");
        await Get("ana", "/missing");
        await Get("ana", "/missing");

        Assert.Equal(4, _calls);
    }

    private sealed class HeaderAuth(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue(UserHeader, out var user)) return Task.FromResult(AuthenticateResult.NoResult());
            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, user.ToString())], "test");
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), "test")));
        }
    }
}

public class HealthTests
{
    [Fact]
    public void Health_answers_ok_without_touching_anything()
    {
        var result = Assert.IsType<OkObjectResult>(new HealthController().Get());

        Assert.Equal("ok", result.Value!.GetType().GetProperty("status")!.GetValue(result.Value));
    }
}

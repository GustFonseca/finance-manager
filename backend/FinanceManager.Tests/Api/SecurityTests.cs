using System.Net;
using System.Security.Claims;
using FinanceManager.Api.Errors;
using FinanceManager.Api.Security;
using FinanceManager.Aplication.Exceptions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FinanceManager.Tests.Api;

public class CorsOriginsTests
{
    private static CorsOrigins Origins(params (string Key, string? Value)[] values) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(values.Select(v => new KeyValuePair<string, string?>(v.Key, v.Value))).Build());

    [Theory]
    [InlineData("https://finance.dev.br", true)]
    [InlineData("https://gustfonseca.github.io", true)]
    [InlineData("https://GUSTFONSECA.github.io/", true)]
    [InlineData("http://localhost:8081", true)]
    [InlineData("http://127.0.0.1:5500", true)]
    [InlineData("https://localhost", true)]
    [InlineData("https://evil.example", false)]
    [InlineData("https://finance.dev.br.evil.example", false)]
    [InlineData("ftp://localhost", false)]
    [InlineData("not a url", false)]
    public void Only_the_app_origins_and_local_development_are_allowed_by_default(string origin, bool allowed)
    {
        Assert.Equal(allowed, Origins().IsAllowed(origin));
    }

    [Fact]
    public void The_list_can_be_configured_as_an_array_or_a_comma_separated_value()
    {
        var array = Origins(("Cors:Origins:0", "https://a.example"), ("Cors:Origins:1", "https://b.example/"));
        var text = Origins(("Cors:Origins", "https://a.example, https://c.example"));

        Assert.True(array.IsAllowed("https://b.example"));
        Assert.False(array.IsAllowed("https://finance.dev.br"));
        Assert.Equal(["https://a.example", "https://c.example"], text.Origins.Order());
    }

    [Fact]
    public void Local_development_origins_can_be_turned_off()
    {
        Assert.False(Origins((CorsOrigins.AllowLocalhostKey, "false")).IsAllowed("http://localhost:8081"));
    }
}

public sealed class RateLimitTests : IAsyncDisposable
{
    private const string UserHeader = "X-Test-User";
    private readonly IHost _host;
    private readonly HttpClient _client;

    public RateLimitTests()
    {
        _host = new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices(services =>
                {
                    services.AddRouting();
                    services.AddRateLimiter(RateLimits.Configure);
                })
                .Configure(app =>
                {
                    app.Use(async (http, next) =>
                    {
                        if (http.Request.Headers.TryGetValue(UserHeader, out var user))
                            http.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, user.ToString())], "test"));
                        await next();
                    });
                    app.UseRouting();
                    app.UseRateLimiter();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapPost("/login", () => Results.Ok()).RequireRateLimiting(RateLimits.Login);
                        endpoints.MapPost("/import", () => Results.Ok()).RequireRateLimiting(RateLimits.Import);
                        endpoints.MapGet("/lookup", () => Results.Ok()).RequireRateLimiting(RateLimits.Lookup);
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

    private async Task<List<HttpStatusCode>> Send(HttpMethod method, string path, int times, string? user = null)
    {
        var codes = new List<HttpStatusCode>();
        for (var i = 0; i < times; i++)
        {
            var request = new HttpRequestMessage(method, path);
            if (user != null) request.Headers.Add(UserHeader, user);
            codes.Add((await _client.SendAsync(request)).StatusCode);
        }
        return codes;
    }

    [Fact]
    public async Task Logins_are_limited_per_address()
    {
        var codes = await Send(HttpMethod.Post, "/login", 11);

        Assert.Equal(10, codes.Count(c => c == HttpStatusCode.OK));
        Assert.Equal(HttpStatusCode.TooManyRequests, codes[^1]);
    }

    [Fact]
    public async Task Imports_and_lookups_are_limited_per_user()
    {
        var ana = await Send(HttpMethod.Post, "/import", 11, "ana");
        var bia = await Send(HttpMethod.Post, "/import", 1, "bia");
        var lookups = await Send(HttpMethod.Get, "/lookup", 31, "ana");

        Assert.Equal(HttpStatusCode.TooManyRequests, ana[^1]);
        Assert.Equal([HttpStatusCode.OK], bia);
        Assert.Equal(30, lookups.Count(c => c == HttpStatusCode.OK));
    }

    [Fact]
    public void Partitions_use_the_user_when_signed_in_and_the_address_otherwise()
    {
        var anonymous = new DefaultHttpContext();
        var signedIn = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "u1")], "test")) };
        anonymous.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.1");

        Assert.Equal("ip:10.0.0.1", RateLimits.ByUser(anonymous));
        Assert.Equal("user:u1", RateLimits.ByUser(signedIn));
        Assert.Equal("unknown", RateLimits.ByIp(signedIn));
    }
}

public sealed class ConflictResponseTests : IAsyncDisposable
{
    private readonly IHost _host;
    private readonly HttpClient _client;

    public ConflictResponseTests()
    {
        _host = new HostBuilder()
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices(services =>
                {
                    services.AddRouting();
                    services.AddProblemDetails();
                    services.AddExceptionHandler<AppExceptionHandler>();
                })
                .Configure(app =>
                {
                    app.UseExceptionHandler();
                    app.UseRouting();
                    app.UseEndpoints(endpoints => endpoints.MapPost("/save", (HttpContext _) => { throw new ConflictException("Tente novamente."); }));
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

    [Fact]
    public async Task Concurrent_changes_answer_409_with_the_message()
    {
        var response = await _client.PostAsync("/save", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("Tente novamente.", await response.Content.ReadAsStringAsync());
    }
}

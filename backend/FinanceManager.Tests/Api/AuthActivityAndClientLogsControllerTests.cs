using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;
using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;
using FinanceManager.Aplication.UseCases.Auth.Queries.ValidateGoogleToken;
using FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;
using FinanceManager.Tests.Support;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Tests.Api;

public class AuthActivityAndClientLogsControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();

    private readonly FakeMediator _mediator = new();
    private readonly ListLogger<AuthController> _logger = new();

    [Fact]
    public async Task GoogleLogin_returns_the_session()
    {
        var session = new LoginResponse { Token = "jwt", Email = "ana@gmail.com", Name = "Ana" };
        var identity = new GoogleIdentity("sub", "ana@gmail.com", "Ana", true, "n");
        _mediator.Returns<ValidateGoogleTokenQuery>(_ => identity);
        _mediator.Returns<GoogleLoginCommand>(_ => session);

        var result = await new AuthController(_mediator, _logger).GoogleLogin(new GoogleLoginRequest { IdToken = "google-token", Nonce = "n" });

        Assert.Same(session, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new ValidateGoogleTokenQuery("google-token", "n"), _mediator.Sent[0]);
        var login = Assert.IsType<GoogleLoginCommand>(_mediator.Sent[1]);
        Assert.Same(identity, login.Identity);
        Assert.True((DateTime.UtcNow - login.Now).Duration() < TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task GoogleLogin_with_an_invalid_google_token_is_401_and_logged()
    {
        _mediator.Throws<ValidateGoogleTokenQuery>(new InvalidJwtException("JWT has expired."));

        var result = await new AuthController(_mediator, _logger).GoogleLogin(new GoogleLoginRequest { IdToken = "velho" });

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal("Login com o Google inválido ou expirado. Tente novamente.", unauthorized.Value!.GetType().GetProperty("message")!.GetValue(unauthorized.Value));
        var (level, message, exception) = Assert.Single(_logger.Entries);
        Assert.Equal(LogLevel.Warning, level);
        Assert.Equal("Google sign-in rejected", message);
        Assert.IsType<InvalidJwtException>(exception);
    }

    [Fact]
    public async Task Activity_Get_pages_the_users_history()
    {
        var before = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var entries = new List<ActivityLogDto>();
        _mediator.Returns<GetActivityQuery>(_ => entries);

        var result = await new ActivityController(_mediator).SignedIn(Me).Get(before, 20);

        Assert.Same(entries, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetActivityQuery(Me, before, 20), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task ClientLogs_reports_an_anonymous_error()
    {
        var request = new ClientLogRequest { Level = "error", Message = "Boom", Stack = "stack", Url = "/", UserAgent = "Firefox" };

        var result = await new ClientLogsController(_mediator).Anonymous().Report(request);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(new ReportClientErrorCommand(null, "error", "Boom", "stack", "/", "Firefox"), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task ClientLogs_attaches_the_signed_in_user()
    {
        await new ClientLogsController(_mediator).SignedIn(Me).Report(new ClientLogRequest { Level = "warning", Message = "Lento" });

        Assert.Equal(Me, Assert.IsType<ReportClientErrorCommand>(Assert.Single(_mediator.Sent)).UserId);
    }
}

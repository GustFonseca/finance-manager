using FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;
using FinanceManager.Tests.Support;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Tests.UseCases.Diagnostics;

public class ReportClientErrorHandlerTests
{
    private readonly ListLogger<ReportClientErrorHandler> _logger = new();

    [Fact]
    public async Task An_error_is_logged_as_error_with_its_context()
    {
        var userId = Guid.NewGuid();

        var ok = await new ReportClientErrorHandler(_logger).Handle(
            new ReportClientErrorCommand(userId, "error", "Boom", "at App.tsx:10", "/painel", "Firefox"));

        Assert.True(ok);
        var (level, message, _) = Assert.Single(_logger.Entries);
        Assert.Equal(LogLevel.Error, level);
        Assert.Equal($"Web app error: Boom at /painel (user {userId}, Firefox)\nat App.tsx:10", message);
    }

    [Fact]
    public async Task A_warning_is_logged_as_warning()
    {
        await new ReportClientErrorHandler(_logger).Handle(new ReportClientErrorCommand(null, "warning", "Lento", null, null, null));

        var (level, message, _) = Assert.Single(_logger.Entries);
        Assert.Equal(LogLevel.Warning, level);
        Assert.StartsWith("Web app warning: Lento", message);
    }

    [Fact]
    public async Task Unknown_levels_are_treated_as_errors_and_long_texts_are_capped()
    {
        var message = new string('m', 1_500);
        var stack = new string('s', 9_000);
        var url = new string('u', 600);

        await new ReportClientErrorHandler(_logger).Handle(new ReportClientErrorCommand(null, "fatal", message, stack, url, "Chrome"));

        var (level, logged, _) = Assert.Single(_logger.Entries);
        Assert.Equal(LogLevel.Error, level);
        Assert.Contains(new string('m', 1_000) + "…", logged);
        Assert.DoesNotContain(new string('m', 1_001), logged);
        Assert.EndsWith(new string('s', 8_000) + "…", logged);
        Assert.Contains(new string('u', 500) + "… ", logged);
    }
}

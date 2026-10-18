using FinanceManager.Aplication.Mediator.Messaging;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;

public class ReportClientErrorHandler : IRequestHandler<ReportClientErrorCommand, bool>
{
    private const int MaxMessage = 1_000;
    private const int MaxStack = 8_000;
    private const int MaxText = 500;

    private readonly ILogger<ReportClientErrorHandler> _logger;

    public ReportClientErrorHandler(ILogger<ReportClientErrorHandler> logger)
    {
        _logger = logger;
    }

    public Task<bool> Handle(ReportClientErrorCommand request, CancellationToken cancellationToken = default)
    {
        var level = request.Level == "warning" ? LogLevel.Warning : LogLevel.Error;
        _logger.Log(
            level,
            "Web app {ClientLevel:l}: {ClientMessage:l} at {ClientUrl:l} (user {UserId}, {UserAgent:l})\n{ClientStack:l}",
            level == LogLevel.Warning ? "warning" : "error",
            Cap(request.Message, MaxMessage),
            Cap(request.Url, MaxText),
            request.UserId,
            Cap(request.UserAgent, MaxText),
            Cap(request.Stack, MaxStack));
        return Task.FromResult(true);
    }

    private static string? Cap(string? value, int max) =>
        value == null || value.Length <= max ? value : value[..max] + "…";
}

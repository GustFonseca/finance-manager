using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;

/// <summary>Writes an error reported by the web app into the API logs; <paramref name="UserId"/> when signed in.</summary>
public record ReportClientErrorCommand(
    Guid? UserId,
    string Level,
    string Message,
    string? Stack,
    string? Url,
    string? UserAgent
) : ICommand<bool>;

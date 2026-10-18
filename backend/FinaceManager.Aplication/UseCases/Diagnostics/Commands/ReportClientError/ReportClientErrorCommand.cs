using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;

public record ReportClientErrorCommand(
    Guid? UserId,
    string Level,
    string Message,
    string? Stack,
    string? Url,
    string? UserAgent
) : ICommand<bool>;

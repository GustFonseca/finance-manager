using FinanceManager.Aplication.Exceptions;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Messaging.Pipeline;

public sealed class ConflictRetryBehavior(AppDbContext db, ILogger<ConflictRetryBehavior>? logger = null) : IRequestBehavior
{
    public const int MaxAttempts = 5;
    public const int RetryDelayMilliseconds = 25;
    public const string ConflictMessage = "Outra alteração foi feita ao mesmo tempo. Tente novamente.";

    public async Task<T> Handle<T>(RequestContext context, Func<Task<T>> next, CancellationToken cancellationToken)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await next();
            }
            catch (Exception ex) when (IsConflict(ex))
            {
                db.DiscardChanges();
                var safeToRetry = context.OwnsTransaction || !context.IsCommand;
                if (!safeToRetry || attempt >= MaxAttempts) throw new ConflictException(ConflictMessage);
                logger?.LogInformation(ex, "Concurrent change detected; running {Request} again (attempt {Attempt})", context.Name, attempt + 1);
                await Task.Delay(Random.Shared.Next(RetryDelayMilliseconds, RetryDelayMilliseconds * 3) * attempt, cancellationToken);
            }
        }
    }

    private static bool IsConflict(Exception exception) =>
        exception is DbUpdateConcurrencyException || DbErrors.IsUniqueViolation(exception);
}

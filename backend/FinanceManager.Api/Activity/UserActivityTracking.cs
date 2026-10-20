using System.Security.Claims;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Auth.Commands.RecordUserActivity;
using Microsoft.Extensions.Caching.Memory;

namespace FinanceManager.Api.Activity;

public sealed class UserActivityTracking
{
    public static readonly TimeSpan CheckEvery = TimeSpan.FromMinutes(30);

    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<UserActivityTracking> _logger;

    public UserActivityTracking(RequestDelegate next, IMemoryCache cache, ILogger<UserActivityTracking> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext http, IMediator mediator)
    {
        var id = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(id, out var userId) && !_cache.TryGetValue(KeyOf(userId), out _))
        {
            _cache.Set(KeyOf(userId), true, CheckEvery);
            try
            {
                await mediator.Send(new RecordUserActivityCommand(userId, DateTime.UtcNow), http.RequestAborted);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Could not record user activity");
            }
        }
        await _next(http);
    }

    public static string KeyOf(Guid userId) => $"user-seen:{userId}";
}

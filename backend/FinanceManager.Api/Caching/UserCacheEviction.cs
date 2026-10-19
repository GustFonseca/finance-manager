using System.Security.Claims;
using FinanceManager.Infrastructure.Caching;

namespace FinanceManager.Api.Caching;

public sealed class UserCacheEviction
{
    private readonly RequestDelegate _next;

    public UserCacheEviction(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext http, UserDataVersions versions)
    {
        await _next(http);
        if (HttpMethods.IsGet(http.Request.Method) || HttpMethods.IsHead(http.Request.Method) || HttpMethods.IsOptions(http.Request.Method)) return;
        if (http.Response.StatusCode >= StatusCodes.Status400BadRequest) return;
        var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null) versions.Bump(userId);
    }
}

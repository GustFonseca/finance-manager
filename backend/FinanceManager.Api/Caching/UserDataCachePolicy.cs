using System.Security.Claims;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Caching;

public sealed class UserDataCachePolicy : IOutputCachePolicy
{
    public const string Name = "user-data";
    public const string AllTag = "user-data";
    public static readonly TimeSpan Duration = TimeSpan.FromMinutes(5);

    public static string TagOf(string userId) => $"user:{userId}";

    public ValueTask CacheRequestAsync(OutputCacheContext context, CancellationToken cancellation)
    {
        var http = context.HttpContext;
        var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var cacheable = userId != null && (HttpMethods.IsGet(http.Request.Method) || HttpMethods.IsHead(http.Request.Method));

        context.EnableOutputCaching = cacheable;
        context.AllowCacheLookup = cacheable;
        context.AllowCacheStorage = cacheable;
        context.AllowLocking = cacheable;
        if (!cacheable) return ValueTask.CompletedTask;

        context.CacheVaryByRules.QueryKeys = "*";
        context.CacheVaryByRules.VaryByValues["user"] = userId!;
        context.Tags.Add(TagOf(userId!));
        context.Tags.Add(AllTag);
        context.ResponseExpirationTimeSpan = Duration;
        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext context, CancellationToken cancellation) => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext context, CancellationToken cancellation)
    {
        if (context.HttpContext.Response.StatusCode != StatusCodes.Status200OK) context.AllowCacheStorage = false;
        return ValueTask.CompletedTask;
    }
}

using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace FinanceManager.Api.Security;

public static class RateLimits
{
    public const string ClientLogs = "client-logs";
    public const string Login = "login";
    public const string Import = "import";
    public const string Lookup = "lookup";

    public static void Configure(RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        Add(options, ClientLogs, 20, ByIp);
        Add(options, Login, 10, ByIp);
        Add(options, Import, 10, ByUser);
        Add(options, Lookup, 30, ByUser);
    }

    public static string ByIp(HttpContext http) => http.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    public static string ByUser(HttpContext http) =>
        http.User.FindFirstValue(ClaimTypes.NameIdentifier) is { } userId ? $"user:{userId}" : $"ip:{ByIp(http)}";

    private static void Add(RateLimiterOptions options, string name, int perMinute, Func<HttpContext, string> partition) =>
        options.AddPolicy(name, http => RateLimitPartition.GetFixedWindowLimiter(
            partition(http),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = perMinute, Window = TimeSpan.FromMinutes(1) }));
}

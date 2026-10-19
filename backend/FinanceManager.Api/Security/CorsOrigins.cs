namespace FinanceManager.Api.Security;

public sealed class CorsOrigins
{
    public const string Section = "Cors:Origins";
    public const string AllowLocalhostKey = "Cors:AllowLocalhost";

    public static readonly string[] Defaults =
    [
        "https://finance.dev.br",
        "https://www.finance.dev.br",
        "https://gustfonseca.github.io",
    ];

    private readonly HashSet<string> _origins;
    private readonly bool _allowLocalhost;

    public CorsOrigins(IConfiguration configuration)
    {
        var configured = configuration.GetSection(Section).Get<string[]>()
            ?? (configuration[Section]?.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        _origins = (configured is { Length: > 0 } ? configured : Defaults)
            .Select(o => o.TrimEnd('/'))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        _allowLocalhost = configuration.GetValue(AllowLocalhostKey, true);
    }

    public IReadOnlyCollection<string> Origins => _origins;

    public bool IsAllowed(string origin)
    {
        if (_origins.Contains(origin.TrimEnd('/'))) return true;
        return _allowLocalhost
               && Uri.TryCreate(origin, UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
               && (uri.IsLoopback || uri.Host == "localhost");
    }
}

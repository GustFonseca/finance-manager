using FinanceManager.Aplication.Auth;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Infrastructure.Auth;

public sealed class ConfigAdminDirectory : IAdminDirectory
{
    private readonly HashSet<string> _emails;

    public ConfigAdminDirectory(IConfiguration config)
    {
        _emails = (config["Admin:Emails"] ?? string.Empty)
            .Split([',', ';', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public bool IsAdmin(string? email) => !string.IsNullOrWhiteSpace(email) && _emails.Contains(email.Trim());
}

using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public ActivityType Type { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>An error the web app reports so it lands in the API logs.</summary>
public class ClientLogRequest
{
    /// <summary>"error" or "warning".</summary>
    public string Level { get; set; } = "error";
    public string Message { get; set; } = string.Empty;
    public string? Stack { get; set; }
    /// <summary>Page where it happened.</summary>
    public string? Url { get; set; }
    public string? UserAgent { get; set; }
}

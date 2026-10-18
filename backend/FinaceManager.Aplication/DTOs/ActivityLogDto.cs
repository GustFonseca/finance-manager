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

public class ClientLogRequest
{
    public string Level { get; set; } = "error";
    public string Message { get; set; } = string.Empty;
    public string? Stack { get; set; }
    public string? Url { get; set; }
    public string? UserAgent { get; set; }
}

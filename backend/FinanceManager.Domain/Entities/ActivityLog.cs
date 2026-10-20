using FinanceManager.Domain.Common;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class ActivityLog : IOwned
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ActivityType Type { get; set; } = ActivityType.INFO;
    public string Source { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

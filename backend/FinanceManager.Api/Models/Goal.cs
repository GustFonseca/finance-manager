namespace FinanceManager.Api.Models;

public enum GoalStatus
{
    ACTIVE,
    COMPLETED,
    CANCELLED
}

public class Goal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long TargetCents { get; set; }
    public long CurrentCents { get; set; }
    public DateTime? Deadline { get; set; }
    public GoalStatus Status { get; set; } = GoalStatus.ACTIVE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

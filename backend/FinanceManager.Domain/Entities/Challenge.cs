using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class Challenge
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ChallengeScope Scope { get; set; }
    public Guid? TargetId { get; set; }
    public long LimitCents { get; set; }
    public DateTime StartsOn { get; set; }
    public int Days { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

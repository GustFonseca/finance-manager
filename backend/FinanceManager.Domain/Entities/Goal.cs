using FinanceManager.Domain.Common;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class Goal : IOwned
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

    public double ProgressPercent => TargetCents > 0 ? Math.Round((double)CurrentCents / TargetCents * 100, 1) : 0;

    public void AddProgress(long amountCents)
    {
        if (Status != GoalStatus.ACTIVE) throw new DomainException("A meta não está ativa.");
        CurrentCents += amountCents;
        if (CurrentCents >= TargetCents) Complete();
    }

    public void Complete() => Status = GoalStatus.COMPLETED;
}

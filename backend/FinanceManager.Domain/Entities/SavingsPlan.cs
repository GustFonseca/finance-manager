namespace FinanceManager.Domain.Entities;

/// <summary>How much the user wants to save each month (one per user).</summary>
public class SavingsPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public long MonthlyGoalCents { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

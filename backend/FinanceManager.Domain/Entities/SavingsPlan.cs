namespace FinanceManager.Domain.Entities;

public class SavingsPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public long MonthlyGoalCents { get; set; }
    public int? WorkHoursPerMonth { get; set; }
    public int? EmergencyMonths { get; set; }
    public Guid? EmergencyGoalId { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

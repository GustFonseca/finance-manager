using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class GoalDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long TargetCents { get; set; }
    public long CurrentCents { get; set; }
    public DateTime? Deadline { get; set; }
    public GoalStatus Status { get; set; }
    public double ProgressPercent { get; set; }
}

public class CreateGoalRequest
{
    public string Name { get; set; } = string.Empty;
    public long TargetCents { get; set; }
    public DateTime? Deadline { get; set; }
}

public class UpdateGoalProgressRequest
{
    public long AmountCents { get; set; }
}

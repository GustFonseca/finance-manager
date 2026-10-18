using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public enum ChallengeStatus
{
    ACTIVE,
    WON,
    LOST,
}

public class ChallengeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ChallengeScope Scope { get; set; }
    public Guid? TargetId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public long LimitCents { get; set; }
    public DateTime StartsOn { get; set; }
    public DateTime EndsOn { get; set; }
    public int Days { get; set; }
    public int DaysElapsed { get; set; }
    public long SpentCents { get; set; }
    public long BaselineCents { get; set; }
    public long SavedCents { get; set; }
    public ChallengeStatus Status { get; set; }
}

public class CreateChallengeRequest
{
    public string Name { get; set; } = string.Empty;
    public ChallengeScope Scope { get; set; }
    public Guid? TargetId { get; set; }
    public long LimitCents { get; set; }
    public DateTime StartsOn { get; set; }
    public int Days { get; set; }
}

using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class ClassificationRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public RuleType Type { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

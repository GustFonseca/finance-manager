using FinanceManager.Domain.Common;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Events;

namespace FinanceManager.Domain.Entities;

public class ClassificationRule : Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public RuleType Type { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static ClassificationRule Create(RuleType type, string pattern, string? value, int priority, string? note)
    {
        var rule = new ClassificationRule();
        rule.Change(type, pattern, value, priority, note);
        return rule;
    }

    public void Change(RuleType type, string pattern, string? value, int priority, string? note)
    {
        Type = type;
        Pattern = pattern;
        Value = value;
        Priority = priority;
        Note = note;
        Raise(new ClassificationRulesChanged(Id));
    }

    public bool SetActive(bool isActive)
    {
        if (IsActive == isActive) return false;
        IsActive = isActive;
        Raise(new ClassificationRulesChanged(Id));
        return true;
    }
}

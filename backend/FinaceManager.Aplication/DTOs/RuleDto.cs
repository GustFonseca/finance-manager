using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class RuleDto
{
    public Guid Id { get; set; }
    public RuleType Type { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public string? Note { get; set; }
    public bool IsDefault { get; set; }
}

public class SaveRuleRequest
{
    public RuleType Type { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int Priority { get; set; }
    public string? Note { get; set; }
}

public class RuleActiveRequest
{
    public bool IsActive { get; set; }
}

public class RuleTestRequest
{
    public string Pattern { get; set; } = string.Empty;
}

public class RuleTestDto
{
    public bool Valid { get; set; }
    public string? Error { get; set; }
    public int MatchCount { get; set; }
    public int CheckedCount { get; set; }
    public List<string> Samples { get; set; } = [];
}

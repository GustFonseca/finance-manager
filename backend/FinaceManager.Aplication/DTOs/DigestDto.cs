namespace FinanceManager.Aplication.DTOs;

public class DigestDto
{
    public PeriodDigestDto Week { get; set; } = new();
    public PeriodDigestDto Month { get; set; } = new();
    public List<GoalProgressDto> Goals { get; set; } = [];
}

public class PeriodDigestDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public long SpentCents { get; set; }
    public long PreviousSpentCents { get; set; }
    public double? ChangePercent { get; set; }
    public long IncomeCents { get; set; }
    public long SavedCents { get; set; }
    public long SuperfluousCents { get; set; }
    public DigestMerchantDto? TopMerchant { get; set; }
    public DigestMerchantDto? TopIncrease { get; set; }
}

public class DigestMerchantDto
{
    public string Name { get; set; } = string.Empty;
    public long Cents { get; set; }
    public long PreviousCents { get; set; }
}

public class GoalProgressDto
{
    public string Name { get; set; } = string.Empty;
    public double Percent { get; set; }
    public long MissingCents { get; set; }
}

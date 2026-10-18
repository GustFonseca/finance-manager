namespace FinanceManager.Aplication.DTOs;

public class TaxReportDto
{
    public int Year { get; set; }
    public long IncomeCents { get; set; }
    public long ExpenseCents { get; set; }
    public long DeductibleCents { get; set; }
    public List<TaxPartyDto> Incomes { get; set; } = [];
    public List<TaxDeductibleGroupDto> Deductibles { get; set; } = [];
}

public class TaxDeductibleGroupDto
{
    public string Label { get; set; } = string.Empty;
    public long Cents { get; set; }
    public List<TaxPartyDto> Providers { get; set; } = [];
}

public class TaxPartyDto
{
    public string Name { get; set; } = string.Empty;
    public string? Document { get; set; }
    public long Cents { get; set; }
    public int Count { get; set; }
}

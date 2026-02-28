namespace FinanceManager.Aplication.DTOs;

public class FinancialSummaryDto
{
    public long TotalIncomeCents { get; set; }
    public long TotalExpenseCents { get; set; }
    public long BalanceCents { get; set; }
    public List<CategorySummaryDto> ByCategory { get; set; } = [];
}

public class CategorySummaryDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public long TotalCents { get; set; }
}

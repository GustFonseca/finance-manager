using FinanceManager.Api.Models;

namespace FinanceManager.Api.DTOs;

public class TransactionDto
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public long AmountCents { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public Recurrence Recurrence { get; set; }
}

public class CreateTransactionRequest
{
    public Guid AccountId { get; set; }
    public Guid CategoryId { get; set; }
    public TransactionType Type { get; set; }
    public long AmountCents { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public Recurrence Recurrence { get; set; } = Recurrence.NONE;
}

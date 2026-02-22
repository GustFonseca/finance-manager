namespace FinanceManager.Api.Models;

public enum TransactionType
{
    INCOME,
    EXPENSE
}

public enum Recurrence
{
    NONE,
    DAILY,
    WEEKLY,
    MONTHLY,
    YEARLY
}

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public Guid CategoryId { get; set; }
    public TransactionType Type { get; set; }
    public long AmountCents { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public Recurrence Recurrence { get; set; } = Recurrence.NONE;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Account Account { get; set; } = null!;
    public Category Category { get; set; } = null!;
}

namespace FinanceManager.Api.Models;

public enum CategoryType
{
    INCOME,
    EXPENSE
}

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string Color { get; set; } = "#888888";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
}

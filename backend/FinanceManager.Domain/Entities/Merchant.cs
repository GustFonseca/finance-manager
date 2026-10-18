using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class Merchant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public string? Document { get; set; }
    public Guid? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = [];
}

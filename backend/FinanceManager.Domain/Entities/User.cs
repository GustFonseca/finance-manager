namespace FinanceManager.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GoogleId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? AvatarIcon { get; set; }
    public string? AvatarColor { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Occupation { get; set; }
    public long? MonthlyIncomeCents { get; set; }
    public int? Payday { get; set; }
    public int? Dependents { get; set; }
    public bool DigestByEmail { get; set; }
    public DateTime? ProfileUpdatedAt { get; set; }

    public ICollection<Account> Accounts { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<Goal> Goals { get; set; } = [];
}

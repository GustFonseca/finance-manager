namespace FinanceManager.Domain.Entities;

public class Account
{
    public Account(Guid userId, string name)
    {
        UserId = userId;
        Name = name;
    }
    
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public long BalanceCents { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];

    public void UpdateName(string newName)
    {
        Name = newName;
    }

    public void AddBalance(long amountCents)
    {
        BalanceCents += amountCents;
    }

    public void SubtractBalance(long amountCents)
    {
        BalanceCents -= amountCents;
    }
}

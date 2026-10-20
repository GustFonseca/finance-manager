using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Entities;

public class Account : IOwned
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
    public Guid Version { get; private set; } = Guid.NewGuid();
    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];

    public void UpdateName(string newName)
    {
        Name = newName;
        Version = Guid.NewGuid();
    }

    public void AddBalance(long amountCents)
    {
        BalanceCents += amountCents;
        Version = Guid.NewGuid();
    }

    public void SubtractBalance(long amountCents)
    {
        BalanceCents -= amountCents;
        Version = Guid.NewGuid();
    }

    public void Record(Transaction transaction) => AddBalance(transaction.SignedAmountCents);

    public void Reverse(Transaction transaction) => AddBalance(-transaction.SignedAmountCents);

    public void ResetBalance()
    {
        BalanceCents = 0;
        Version = Guid.NewGuid();
    }
}

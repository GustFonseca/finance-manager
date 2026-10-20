using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Entities;

public class Debt : IOwned
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long BalanceCents { get; set; }
    public decimal MonthlyRatePercent { get; set; }
    public long MinimumPaymentCents { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

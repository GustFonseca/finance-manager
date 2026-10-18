using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class SubscriptionDecision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string MerchantKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public SubscriptionChoice Choice { get; set; }
    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

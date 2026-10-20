using FinanceManager.Domain.Common;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

public class WishlistItem : IOwned
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long PriceCents { get; set; }
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime DecideAfter { get; set; }
    public WishStatus Status { get; set; } = WishStatus.WAITING;
    public DateTime? DecidedAt { get; set; }

    public User User { get; set; } = null!;
}

using FinanceManager.Domain.Common;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Events;

namespace FinanceManager.Domain.Entities;

public class Merchant : Entity, IOwned
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public string? Document { get; set; }
    public Guid? CategoryId { get; set; }
    public SpendingClass? Class { get; set; }
    public string? ActivityCode { get; set; }
    public string? Activity { get; set; }
    public DateTime? EnrichedAt { get; set; }
    public int EnrichmentAttempts { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = [];

    public void ApplyActivity(string? activityCode, string? activity, DateTime now)
    {
        EnrichedAt = now;
        ActivityCode = activityCode;
        Activity = activity;
        Raise(new MerchantEnriched(Id, UserId));
    }
}

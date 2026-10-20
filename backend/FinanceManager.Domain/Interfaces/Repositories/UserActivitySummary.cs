namespace FinanceManager.Domain.Interfaces.Repositories;

public record UserActivitySummary(
    Guid Id, string Name, string Email, DateTime CreatedAt, DateTime? LastLoginAt, DateTime? LastSeenAt, int LoginCount, int TransactionCount);

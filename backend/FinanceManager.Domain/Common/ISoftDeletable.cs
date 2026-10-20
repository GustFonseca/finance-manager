namespace FinanceManager.Domain.Common;

public interface ISoftDeletable
{
    DateTime? DeletedAt { get; }
}

namespace FinanceManager.Domain.Common;

public interface IOwned
{
    Guid UserId { get; }
}

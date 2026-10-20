using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Events;

public sealed record MerchantEnriched(Guid MerchantId, Guid UserId) : IDomainEvent;

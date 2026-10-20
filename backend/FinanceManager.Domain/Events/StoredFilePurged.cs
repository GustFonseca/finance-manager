using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Events;

public sealed record StoredFilePurged(Guid FileId, string StorageKey) : IDomainEvent;

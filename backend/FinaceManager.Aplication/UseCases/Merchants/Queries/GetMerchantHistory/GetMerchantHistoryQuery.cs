using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;

/// <summary>One merchant month by month, from the month of <paramref name="Start"/> until <paramref name="End"/>. Null when not found.</summary>
public record GetMerchantHistoryQuery(Guid UserId, Guid MerchantId, DateTime Start, DateTime End) : IQuery<MerchantHistoryDto?>;

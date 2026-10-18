using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;

public record GetMerchantHistoryQuery(Guid UserId, Guid MerchantId, DateTime Start, DateTime End) : IQuery<MerchantHistoryDto?>;

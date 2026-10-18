using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetUnsortedMerchants;

public record GetUnsortedMerchantsQuery(Guid UserId, DateTime Start, DateTime End) : IQuery<List<MerchantSpendingDto>>;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;

public record GetMerchantsQuery(Guid UserId) : IQuery<List<MerchantDto>>;

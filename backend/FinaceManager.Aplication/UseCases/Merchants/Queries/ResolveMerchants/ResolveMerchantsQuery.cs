using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;

public record ResolveMerchantsQuery(Guid UserId, List<ImportLineRequest> Lines) : IQuery<List<MerchantMatchDto>>;

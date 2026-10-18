using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;

/// <summary>The merchant of each description (lines being imported), without creating anything.</summary>
public record ResolveMerchantsQuery(Guid UserId, List<string> Descriptions) : IQuery<List<MerchantMatchDto>>;

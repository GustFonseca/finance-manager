using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantsPendingEnrichment;

public record PendingEnrichment(Guid MerchantId, string Cnpj);

public record GetMerchantsPendingEnrichmentQuery(int Max) : IQuery<List<PendingEnrichment>>;

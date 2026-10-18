using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantsPendingEnrichment;

public class GetMerchantsPendingEnrichmentHandler : IRequestHandler<GetMerchantsPendingEnrichmentQuery, List<PendingEnrichment>>
{
    private readonly IMerchantRepository _merchantRepository;

    public GetMerchantsPendingEnrichmentHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<List<PendingEnrichment>> Handle(GetMerchantsPendingEnrichmentQuery request, CancellationToken cancellationToken = default)
    {
        var merchants = await _merchantRepository.GetPendingEnrichmentAsync(request.Max);
        return merchants
            .Select(m => (m.Id, Cnpj: Cnpj.Digits(m.Document)))
            .Where(m => m.Cnpj != null)
            .Select(m => new PendingEnrichment(m.Id, m.Cnpj!))
            .ToList();
    }
}

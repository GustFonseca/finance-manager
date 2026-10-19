using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.RecordEnrichmentFailure;

public class RecordEnrichmentFailureHandler : IRequestHandler<RecordEnrichmentFailureCommand, bool>
{
    public const int MaxAttempts = 3;

    private readonly IMerchantRepository _merchantRepository;

    public RecordEnrichmentFailureHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<bool> Handle(RecordEnrichmentFailureCommand request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetByIdAsync(request.MerchantId);
        if (merchant == null) return false;
        merchant.EnrichmentAttempts++;
        var givenUp = merchant.EnrichmentAttempts >= MaxAttempts;
        if (givenUp) merchant.EnrichedAt = request.Now;
        await _merchantRepository.UpdateAsync(merchant);
        return givenUp;
    }
}

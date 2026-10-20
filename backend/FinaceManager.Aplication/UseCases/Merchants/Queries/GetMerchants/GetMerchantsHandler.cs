using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;

public class GetMerchantsHandler : IRequestHandler<GetMerchantsQuery, List<MerchantDto>>
{
    private readonly IMerchantRepository _merchantRepository;

    public GetMerchantsHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<List<MerchantDto>> Handle(GetMerchantsQuery request, CancellationToken cancellationToken = default)
    {
        var merchants = await _merchantRepository.GetByUserIdAsync(request.UserId);
        return merchants.Select(x => x.ToDto()).ToList();
    }
}

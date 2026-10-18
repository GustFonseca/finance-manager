using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;

public class GetMerchantsHandler : IRequestHandler<GetMerchantsQuery, List<MerchantDto>>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IMapper _mapper;

    public GetMerchantsHandler(IMerchantRepository merchantRepository, IMapper mapper)
    {
        _merchantRepository = merchantRepository;
        _mapper = mapper;
    }

    public async Task<List<MerchantDto>> Handle(GetMerchantsQuery request, CancellationToken cancellationToken = default)
    {
        var merchants = await _merchantRepository.GetByUserIdAsync(request.UserId);
        return _mapper.Map<List<MerchantDto>>(merchants);
    }
}

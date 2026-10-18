using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;

public class SetMerchantClassHandler : IRequestHandler<SetMerchantClassCommand, MerchantDto?>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IMapper _mapper;

    public SetMerchantClassHandler(IMerchantRepository merchantRepository, IMapper mapper)
    {
        _merchantRepository = merchantRepository;
        _mapper = mapper;
    }

    public async Task<MerchantDto?> Handle(SetMerchantClassCommand request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetByIdAsync(request.MerchantId);
        if (merchant == null || merchant.UserId != request.UserId) return null;

        merchant.Class = request.Class;
        await _merchantRepository.UpdateAsync(merchant);
        return _mapper.Map<MerchantDto>(merchant);
    }
}

using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;

public class SetMerchantClassHandler : IRequestHandler<SetMerchantClassCommand, MerchantDto>
{
    private readonly IMerchantRepository _merchantRepository;

    public SetMerchantClassHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<MerchantDto> Handle(SetMerchantClassCommand request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetOwnedAsync(request.MerchantId, request.UserId);

        merchant.Class = request.Class;
        await _merchantRepository.UpdateAsync(merchant);
        return merchant.ToDto();
    }
}

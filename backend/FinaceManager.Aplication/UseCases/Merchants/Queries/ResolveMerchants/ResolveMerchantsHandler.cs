using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;

public class ResolveMerchantsHandler : IRequestHandler<ResolveMerchantsQuery, List<MerchantMatchDto>>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IUserRepository _userRepository;

    public ResolveMerchantsHandler(IMerchantRepository merchantRepository, IUserRepository userRepository)
    {
        _merchantRepository = merchantRepository;
        _userRepository = userRepository;
    }

    public async Task<List<MerchantMatchDto>> Handle(ResolveMerchantsQuery request, CancellationToken cancellationToken = default)
    {
        var owner = await _userRepository.GetByIdAsync(request.UserId);
        var known = (await _merchantRepository.GetByUserIdAsync(request.UserId)).ToDictionary(m => m.Key);

        return request.Descriptions
            .Distinct()
            .Select(description => (Description: description, Parsed: MerchantParser.Parse(description, owner?.Name)))
            .Where(d => d.Parsed != null)
            .Select(d =>
            {
                var merchant = known.GetValueOrDefault(d.Parsed!.Key);
                return new MerchantMatchDto
                {
                    Description = d.Description,
                    Name = merchant?.Name ?? d.Parsed.Name,
                    Kind = merchant?.Kind ?? d.Parsed.Kind,
                    MerchantId = merchant?.Id,
                    CategoryId = merchant?.CategoryId,
                };
            })
            .ToList();
    }
}

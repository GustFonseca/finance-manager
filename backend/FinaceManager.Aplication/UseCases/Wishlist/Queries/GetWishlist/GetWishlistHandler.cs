using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Wishlist.Queries.GetWishlist;

public class GetWishlistHandler : IRequestHandler<GetWishlistQuery, WishlistDto>
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly ISavingsPlanRepository _planRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetWishlistHandler(
        IWishlistRepository wishlistRepository, ITransactionRepository transactionRepository,
        ISavingsPlanRepository planRepository, IClassificationRulesProvider rulesProvider)
    {
        _wishlistRepository = wishlistRepository;
        _transactionRepository = transactionRepository;
        _planRepository = planRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<WishlistDto> Handle(GetWishlistQuery request, CancellationToken cancellationToken = default)
    {
        var items = await _wishlistRepository.GetByUserIdAsync(request.UserId);
        var monthStart = new DateTime(request.Now.Year, request.Now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, monthStart.AddMonths(-WorkValue.IncomeMonths), request.Now);
        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);

        return new WishlistDto
        {
            Items = items.Select(i => WishlistMapper.ToDto(i, request.Now))
                .OrderByDescending(i => i.ReadyToDecide)
                .ThenBy(i => i.Status)
                .ThenByDescending(i => i.CreatedAt)
                .ToList(),
            SavedCents = items.Where(i => i.Status == WishStatus.GAVE_UP).Sum(i => i.PriceCents),
            WaitingCents = items.Where(i => i.Status == WishStatus.WAITING).Sum(i => i.PriceCents),
            HourValueCents = WorkValue.HourCents(transactions, monthStart, WorkValue.Hours(plan), rules),
            WaitHours = WishlistMapper.WaitHours,
        };
    }
}

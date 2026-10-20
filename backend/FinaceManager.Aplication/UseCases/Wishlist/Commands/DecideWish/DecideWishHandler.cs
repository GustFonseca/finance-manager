using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.DecideWish;

public class DecideWishHandler : IRequestHandler<DecideWishCommand, WishlistItemDto>
{
    private readonly IWishlistRepository _wishlistRepository;

    public DecideWishHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<WishlistItemDto> Handle(DecideWishCommand request, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(request.Status)) throw new BusinessRuleException("Decisão inválida.");
        var item = await _wishlistRepository.GetOwnedAsync(request.WishId, request.UserId);
        if (request.Status == WishStatus.BOUGHT && item.Status == WishStatus.WAITING && request.Now < item.DecideAfter)
            throw new BusinessRuleException($"Espere até {item.DecideAfter:dd/MM HH:mm} (UTC) antes de decidir comprar.");

        item.Status = request.Status;
        item.DecidedAt = request.Status == WishStatus.WAITING ? null : request.Now;
        await _wishlistRepository.UpdateAsync(item);
        return WishlistMapper.ToDto(item, request.Now);
    }
}

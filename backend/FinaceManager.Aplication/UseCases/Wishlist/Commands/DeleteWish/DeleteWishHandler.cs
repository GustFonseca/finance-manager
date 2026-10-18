using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.DeleteWish;

public class DeleteWishHandler : IRequestHandler<DeleteWishCommand, bool>
{
    private readonly IWishlistRepository _wishlistRepository;

    public DeleteWishHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<bool> Handle(DeleteWishCommand request, CancellationToken cancellationToken = default)
    {
        var item = await _wishlistRepository.GetByIdAsync(request.WishId);
        if (item == null || item.UserId != request.UserId) return false;
        await _wishlistRepository.DeleteAsync(item);
        return true;
    }
}

using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.DeleteWish;

public class DeleteWishHandler : IRequestHandler<DeleteWishCommand>
{
    private readonly IWishlistRepository _wishlistRepository;

    public DeleteWishHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task Handle(DeleteWishCommand request, CancellationToken cancellationToken = default)
    {
        var item = await _wishlistRepository.GetOwnedAsync(request.WishId, request.UserId);
        await _wishlistRepository.DeleteAsync(item);
    }
}

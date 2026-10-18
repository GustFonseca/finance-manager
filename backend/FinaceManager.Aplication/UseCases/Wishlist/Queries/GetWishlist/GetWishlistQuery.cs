using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Wishlist.Queries.GetWishlist;

public record GetWishlistQuery(Guid UserId, DateTime Now) : IQuery<WishlistDto>;

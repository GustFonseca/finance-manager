using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.CreateWish;

public record CreateWishCommand(Guid UserId, string Name, long PriceCents, string? Link, DateTime Now) : ICommand<WishlistItemDto>;

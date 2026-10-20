using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.DecideWish;

public record DecideWishCommand(Guid UserId, Guid WishId, WishStatus Status, DateTime Now) : ICommand<WishlistItemDto>;

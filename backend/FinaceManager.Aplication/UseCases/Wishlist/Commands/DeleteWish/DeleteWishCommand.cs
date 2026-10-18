using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.DeleteWish;

public record DeleteWishCommand(Guid UserId, Guid WishId) : ICommand<bool>;

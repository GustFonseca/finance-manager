using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.UseCases.Wishlist;

public static class WishlistMapper
{
    public const int WaitHours = 48;

    public static WishlistItemDto ToDto(WishlistItem item, DateTime now) => new()
    {
        Id = item.Id,
        Name = item.Name,
        PriceCents = item.PriceCents,
        Link = item.Link,
        CreatedAt = item.CreatedAt,
        DecideAfter = item.DecideAfter,
        Status = item.Status,
        DecidedAt = item.DecidedAt,
        ReadyToDecide = item.Status == Domain.Enuns.WishStatus.WAITING && now >= item.DecideAfter,
    };
}

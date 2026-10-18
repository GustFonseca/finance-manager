using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class WishlistDto
{
    public List<WishlistItemDto> Items { get; set; } = [];
    public long SavedCents { get; set; }
    public long WaitingCents { get; set; }
    public long HourValueCents { get; set; }
    public int WaitHours { get; set; }
}

public class WishlistItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long PriceCents { get; set; }
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime DecideAfter { get; set; }
    public WishStatus Status { get; set; }
    public DateTime? DecidedAt { get; set; }
    public bool ReadyToDecide { get; set; }
}

public class CreateWishRequest
{
    public string Name { get; set; } = string.Empty;
    public long PriceCents { get; set; }
    public string? Link { get; set; }
}

public class WishDecisionRequest
{
    public WishStatus Status { get; set; }
}

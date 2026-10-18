using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Wishlist.Commands.CreateWish;

public class CreateWishHandler : IRequestHandler<CreateWishCommand, WishlistItemDto>
{
    private readonly IWishlistRepository _wishlistRepository;

    public CreateWishHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<WishlistItemDto> Handle(CreateWishCommand request, CancellationToken cancellationToken = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0) throw new BusinessRuleException("Diga o que você quer comprar.");
        if (name.Length > WishlistMapper.MaxNameLength) throw new BusinessRuleException($"O nome pode ter até {WishlistMapper.MaxNameLength} caracteres.");
        if (request.PriceCents <= 0) throw new BusinessRuleException("Informe o preço.");
        var link = string.IsNullOrWhiteSpace(request.Link) ? null : request.Link.Trim();
        if (link != null && (link.Length > WishlistMapper.MaxLinkLength || !Uri.TryCreate(link, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            throw new BusinessRuleException("O link deve ser um endereço http(s) válido.");

        var item = new WishlistItem
        {
            UserId = request.UserId,
            Name = name,
            PriceCents = request.PriceCents,
            Link = link,
            CreatedAt = request.Now,
            DecideAfter = request.Now.AddHours(WishlistMapper.WaitHours),
        };
        await _wishlistRepository.CreateAsync(item);
        return WishlistMapper.ToDto(item, request.Now);
    }
}

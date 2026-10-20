using FinanceManager.Aplication.Validation;
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
        var name = Input.Name(request.Name, EntityLimits.WishNameLength, "Diga o que você quer comprar.");
        if (request.PriceCents <= 0) throw new BusinessRuleException("Informe o preço.");
        var link = Input.Optional(request.Link);
        if (link != null && (link.Length > EntityLimits.LinkLength || !Uri.TryCreate(link, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
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

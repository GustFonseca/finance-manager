using System.Security.Claims;
using FinanceManager.Api.Caching;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.CreateWish;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.DecideWish;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.DeleteWish;
using FinanceManager.Aplication.UseCases.Wishlist.Queries.GetWishlist;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class WishlistController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<WishlistDto>> Get() => Ok(await Mediator.Send(new GetWishlistQuery(UserId, DateTime.UtcNow)));

    [HttpPost]
    public async Task<ActionResult<WishlistItemDto>> Create([FromBody] CreateWishRequest request)
    {
        var item = await Mediator.Send(new CreateWishCommand(UserId, request.Name, request.PriceCents, request.Link, DateTime.UtcNow));
        return Created($"/api/wishlist/{item.Id}", item);
    }

    [HttpPut("{id}/decision")]
    public async Task<ActionResult<WishlistItemDto>> Decide(Guid id, [FromBody] WishDecisionRequest request)
    {
        var item = await Mediator.Send(new DecideWishCommand(UserId, id, request.Status, DateTime.UtcNow));
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteWishCommand(UserId, id));
        return NoContent();
    }
}

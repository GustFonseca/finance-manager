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
public class WishlistController : ControllerBase
{
    private readonly IMediator _mediator;

    public WishlistController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<WishlistDto>> Get() => Ok(await _mediator.Send(new GetWishlistQuery(GetUserId(), DateTime.UtcNow)));

    [HttpPost]
    public async Task<ActionResult<WishlistItemDto>> Create([FromBody] CreateWishRequest request)
    {
        var item = await _mediator.Send(new CreateWishCommand(GetUserId(), request.Name, request.PriceCents, request.Link, DateTime.UtcNow));
        return Created($"/api/wishlist/{item.Id}", item);
    }

    [HttpPut("{id}/decision")]
    public async Task<ActionResult<WishlistItemDto>> Decide(Guid id, [FromBody] WishDecisionRequest request)
    {
        var item = await _mediator.Send(new DecideWishCommand(GetUserId(), id, request.Status, DateTime.UtcNow));
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await _mediator.Send(new DeleteWishCommand(GetUserId(), id))) return NotFound();
        return NoContent();
    }
}

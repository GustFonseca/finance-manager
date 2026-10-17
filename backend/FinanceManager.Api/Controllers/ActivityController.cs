using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/activity")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivityController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>The user's history, newest first; pass the oldest <c>createdAt</c> as <paramref name="before"/> for the next page.</summary>
    [HttpGet]
    public async Task<ActionResult<List<ActivityLogDto>>> Get([FromQuery] DateTime? before, [FromQuery] int limit = 50)
    {
        var entries = await _mediator.Send(new GetActivityQuery(GetUserId(), before, limit));
        return Ok(entries);
    }
}

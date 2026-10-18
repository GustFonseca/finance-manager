using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Challenges.Commands.CreateChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Queries.GetChallenges;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/challenges")]
[Authorize]
public class ChallengesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChallengesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<ChallengeDto>>> GetAll()
    {
        return Ok(await _mediator.Send(new GetChallengesQuery(GetUserId(), DateTime.UtcNow)));
    }

    [HttpPost]
    public async Task<ActionResult<ChallengeDto>> Create([FromBody] CreateChallengeRequest request)
    {
        var challenge = await _mediator.Send(new CreateChallengeCommand(
            GetUserId(), request.Name, request.Scope, request.TargetId, request.LimitCents, request.StartsOn, request.Days, DateTime.UtcNow));
        return Created($"/api/challenges/{challenge.Id}", challenge);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _mediator.Send(new DeleteChallengeCommand(GetUserId(), id));
        if (!deleted) return NotFound();
        return NoContent();
    }
}

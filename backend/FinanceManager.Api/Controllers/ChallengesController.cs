using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Challenges.Commands.CreateChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Queries.GetChallenges;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/challenges")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class ChallengesController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<ChallengeDto>>> GetAll()
    {
        return Ok(await Mediator.Send(new GetChallengesQuery(UserId, DateTime.UtcNow)));
    }

    [HttpPost]
    public async Task<ActionResult<ChallengeDto>> Create([FromBody] CreateChallengeRequest request)
    {
        var challenge = await Mediator.Send(new CreateChallengeCommand(
            UserId, request.Name, request.Scope, request.TargetId, request.LimitCents, request.StartsOn, request.Days, DateTime.UtcNow));
        return Created($"/api/challenges/{challenge.Id}", challenge);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteChallengeCommand(UserId, id));
        return NoContent();
    }
}

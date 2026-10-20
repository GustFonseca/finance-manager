using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Activity.Queries.GetActivity;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/activity")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class ActivityController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<ActivityLogDto>>> Get([FromQuery] DateTime? before, [FromQuery] int limit = 50)
    {
        var entries = await Mediator.Send(new GetActivityQuery(UserId, before, limit));
        return Ok(entries);
    }
}

using FinanceManager.Api.Authorization;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Auth.Queries.GetUsersOverview;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AdminPolicy.Name)]
public class AdminController(IMediator mediator) : AppController(mediator)
{
    [HttpGet("users")]
    public async Task<ActionResult<List<UserOverviewDto>>> GetUsers() =>
        Ok(await Mediator.Send(new GetUsersOverviewQuery(DateTime.UtcNow)));
}

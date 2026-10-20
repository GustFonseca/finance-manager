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
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserOverviewDto>>> GetUsers() =>
        Ok(await _mediator.Send(new GetUsersOverviewQuery(DateTime.UtcNow)));
}

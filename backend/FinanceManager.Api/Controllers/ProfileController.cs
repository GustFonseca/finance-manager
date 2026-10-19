using System.Security.Claims;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Profile.Commands.UpdateProfile;
using FinanceManager.Aplication.UseCases.Profile.Queries.GetProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> Get()
    {
        var profile = await _mediator.Send(new GetProfileQuery(GetUserId()));
        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<ProfileDto>> Update([FromBody] UpdateProfileRequest request)
    {
        var profile = await _mediator.Send(new UpdateProfileCommand(GetUserId(), request, DateTime.UtcNow));
        if (profile == null) return NotFound();
        return Ok(profile);
    }
}

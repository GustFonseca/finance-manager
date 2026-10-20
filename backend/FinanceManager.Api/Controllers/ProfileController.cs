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
public class ProfileController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ProfileDto>> Get()
    {
        var profile = await Mediator.Send(new GetProfileQuery(UserId));
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<ProfileDto>> Update([FromBody] UpdateProfileRequest request)
    {
        var profile = await Mediator.Send(new UpdateProfileCommand(UserId, request, DateTime.UtcNow));
        return Ok(profile);
    }
}

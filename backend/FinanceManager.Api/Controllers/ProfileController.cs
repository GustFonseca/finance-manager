using System.Security.Claims;
using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IAdminDirectory _admins;

    public ProfileController(IAdminDirectory admins)
    {
        _admins = admins;
    }

    [HttpGet]
    public ActionResult<ProfileDto> Get()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        return Ok(new ProfileDto { Email = email, Name = User.FindFirstValue(ClaimTypes.Name) ?? email, IsAdmin = _admins.IsAdmin(email) });
    }
}

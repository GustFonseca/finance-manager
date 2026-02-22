using FinanceManager.Api.DTOs.Auth;
using FinanceManager.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("google")]
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var (user, token) = await _authService.AuthenticateWithGoogle(request.IdToken);
            return Ok(new LoginResponse
            {
                Token = token,
                Email = user.Email,
                Name = user.Name
            });
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}

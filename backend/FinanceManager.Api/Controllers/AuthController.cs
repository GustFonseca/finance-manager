using Microsoft.AspNetCore.RateLimiting;
using FinanceManager.Api.Security;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;
using FinanceManager.Aplication.UseCases.Auth.Queries.ValidateGoogleToken;
using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;

namespace FinanceManager.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public class AuthController(IMediator mediator, ILogger<AuthController> logger) : AppController(mediator)
{
    [HttpPost("google")]
    [EnableRateLimiting(RateLimits.Login)]
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var identity = await Mediator.Send(new ValidateGoogleTokenQuery(request.IdToken, request.Nonce));
            var response = await Mediator.Send(new GoogleLoginCommand(identity, DateTime.UtcNow));
            return Ok(response);
        }
        catch (InvalidJwtException ex)
        {
            logger.LogWarning(ex, "Google sign-in rejected");
            return Unauthorized(new { message = "Login com o Google inválido ou expirado. Tente novamente." });
        }
    }
}

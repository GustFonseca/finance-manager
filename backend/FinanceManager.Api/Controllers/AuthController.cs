using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;
using Microsoft.AspNetCore.Mvc;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;

namespace FinanceManager.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMediator mediator, ILogger<AuthController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpPost("google")]
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var response = await _mediator.Send(new GoogleLoginCommand(request.IdToken));
            return Ok(response);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Google sign-in rejected");
            return Unauthorized(new { message = "Login com o Google inválido ou expirado. Tente novamente." });
        }
    }
}

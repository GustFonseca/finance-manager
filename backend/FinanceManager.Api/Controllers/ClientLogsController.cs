using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Diagnostics.Commands.ReportClientError;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FinanceManager.Api.Controllers;

/// <summary>Receives errors from the web app, so front and back end share one log.</summary>
[ApiController]
[Route("api/client-logs")]
[AllowAnonymous]
[EnableRateLimiting("client-logs")]
public class ClientLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ClientLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Report([FromBody] ClientLogRequest request)
    {
        // Anonymous on purpose (the app can fail before sign-in); attach the user when known.
        Guid? userId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
        await _mediator.Send(new ReportClientErrorCommand(
            userId, request.Level, request.Message, request.Stack, request.Url, request.UserAgent));
        return NoContent();
    }
}

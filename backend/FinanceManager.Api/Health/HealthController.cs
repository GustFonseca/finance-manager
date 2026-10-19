using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Health;

[ApiController]
[Route("health")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", commit = Commit(_configuration) });

    public static string? Commit(IConfiguration configuration) =>
        new[] { configuration["BUILD_COMMIT"], configuration["RENDER_GIT_COMMIT"] }.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c));
}

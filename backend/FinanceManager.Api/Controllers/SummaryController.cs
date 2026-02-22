using System.Security.Claims;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/summary")]
[Authorize]
public class SummaryController : ControllerBase
{
    private readonly SummaryService _summaryService;

    public SummaryController(SummaryService summaryService)
    {
        _summaryService = summaryService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<FinancialSummaryDto>> GetSummary(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end)
    {
        var summary = await _summaryService.GetSummary(GetUserId(), start, end);
        return Ok(summary);
    }
}

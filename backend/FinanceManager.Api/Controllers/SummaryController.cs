using System.Security.Claims;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/summary")]
[Authorize]
public class SummaryController : ControllerBase
{
    private readonly IMediator _mediator;

    public SummaryController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<FinancialSummaryDto>> GetSummary(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var summary = await _mediator.Send(new GetFinancialSummaryQuery(GetUserId(), start, end, accountId));
        return Ok(summary);
    }

    /// <summary>Fixed costs and subscriptions (marked or detected), optionally of one account.</summary>
    [HttpGet("recurring")]
    public async Task<ActionResult<List<RecurringExpenseDto>>> GetRecurring(
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var now = (end ?? DateTime.UtcNow).ToUniversalTime();
        var recurring = await _mediator.Send(new GetRecurringExpensesQuery(GetUserId(), now, accountId));
        return Ok(recurring);
    }

    /// <summary>The spending dashboard: by class, category and merchant, the trend, and what could be reduced.</summary>
    [HttpGet("spending")]
    public async Task<ActionResult<SpendingAnalysisDto>> GetSpending(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var analysis = await _mediator.Send(new GetSpendingAnalysisQuery(GetUserId(), monthStart, now, accountId));
        return Ok(analysis);
    }
}

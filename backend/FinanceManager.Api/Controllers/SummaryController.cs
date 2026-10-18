using System.Security.Claims;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetAvoidableSpending;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetCashFlowForecast;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetDailyBudget;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetDigest;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetCalendar;
using FinanceManager.Aplication.UseCases.Summary.Commands.DismissInsight;
using FinanceManager.Aplication.UseCases.Summary.Commands.SetSubscriptionChoice;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/summary")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class SummaryController : ControllerBase
{
    private readonly IMediator _mediator;

    public SummaryController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<FinancialSummaryDto>> GetSummary(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var summary = await _mediator.Send(new GetFinancialSummaryQuery(GetUserId(), start?.ToUniversalTime(), end?.ToUniversalTime(), accountId));
        return Ok(summary);
    }

    [HttpGet("recurring")]
    public async Task<ActionResult<List<RecurringExpenseDto>>> GetRecurring(
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (_, now) = MonthPeriod.Resolve(null, end);
        var recurring = await _mediator.Send(new GetRecurringExpensesQuery(GetUserId(), now, accountId));
        return Ok(recurring);
    }

    [HttpGet("avoidable")]
    public async Task<ActionResult<AvoidableSpendingDto>> GetAvoidable(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetAvoidableSpendingQuery(GetUserId(), monthStart, now, accountId)));
    }

    [HttpGet("forecast")]
    public async Task<ActionResult<CashFlowForecastDto>> GetForecast(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetCashFlowForecastQuery(GetUserId(), monthStart, now, accountId)));
    }

    [HttpGet("daily")]
    public async Task<ActionResult<DailyBudgetDto>> GetDaily(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] DateTime? dayStart)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var day = dayStart?.ToUniversalTime() ?? new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        if (day > now) day = now;
        return Ok(await _mediator.Send(new GetDailyBudgetQuery(GetUserId(), monthStart, now, day)));
    }

    [HttpGet("digest")]
    public async Task<ActionResult<DigestDto>> GetDigest(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] DateTime? dayStart)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var day = dayStart?.ToUniversalTime() ?? new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        if (day > now) day = now;
        return Ok(await _mediator.Send(new GetDigestQuery(GetUserId(), monthStart, now, day)));
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<CalendarDto>> GetCalendar([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetCalendarQuery(GetUserId(), monthStart, now)));
    }

    [HttpPost("dismissals")]
    public async Task<IActionResult> Dismiss([FromBody] DismissInsightRequest request)
    {
        await _mediator.Send(new DismissInsightCommand(GetUserId(), request.Key));
        return NoContent();
    }

    [HttpPut("subscriptions/choice")]
    public async Task<IActionResult> SetSubscriptionChoice([FromBody] SubscriptionChoiceRequest request)
    {
        await _mediator.Send(new SetSubscriptionChoiceCommand(GetUserId(), request.Key, request.Name, request.Choice, DateTime.UtcNow));
        return NoContent();
    }

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

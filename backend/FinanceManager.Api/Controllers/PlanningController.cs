using System.Security.Claims;
using FinanceManager.Api.Caching;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Planning.Commands.SetEmergencyFund;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetEmergencyFund;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetNetWorth;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetSeasonalExpenses;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetTaxReport;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/planning")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class PlanningController(IMediator mediator) : AppController(mediator)
{
    [HttpGet("emergency")]
    public async Task<ActionResult<EmergencyFundDto>> GetEmergency([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await Mediator.Send(new GetEmergencyFundQuery(UserId, monthStart, now)));
    }

    [HttpPut("emergency")]
    public async Task<IActionResult> SetEmergency([FromBody] EmergencyFundRequest request)
    {
        await Mediator.Send(new SetEmergencyFundCommand(UserId, request.Months, request.GoalId));
        return NoContent();
    }

    [HttpGet("seasonal")]
    public async Task<ActionResult<SeasonalExpensesDto>> GetSeasonal([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await Mediator.Send(new GetSeasonalExpensesQuery(UserId, monthStart, now)));
    }

    [HttpGet("tax-report")]
    public async Task<ActionResult<TaxReportDto>> GetTaxReport([FromQuery] int? year) =>
        Ok(await Mediator.Send(new GetTaxReportQuery(UserId, year ?? DateTime.UtcNow.Year - 1)));

    [HttpGet("net-worth")]
    public async Task<ActionResult<NetWorthDto>> GetNetWorth([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        return Ok(await Mediator.Send(new GetNetWorthQuery(UserId, monthStart, now)));
    }
}

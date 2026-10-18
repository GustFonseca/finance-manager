using System.Security.Claims;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;
using FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/savings")]
[Authorize]
public class SavingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SavingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<SavingsPlanDto>> Get([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var plan = await _mediator.Send(new GetSavingsPlanQuery(GetUserId(), monthStart, now));
        return Ok(plan);
    }

    [HttpPut("goal")]
    public async Task<IActionResult> SetGoal([FromBody] SavingsGoalRequest request)
    {
        await _mediator.Send(new SetSavingsGoalCommand(GetUserId(), request.MonthlyGoalCents));
        return NoContent();
    }

    [HttpPut("budgets/{categoryId}")]
    public async Task<IActionResult> SetBudget(Guid categoryId, [FromBody] CategoryBudgetRequest request)
    {
        var saved = await _mediator.Send(new SetCategoryBudgetCommand(GetUserId(), categoryId, request.LimitCents));
        if (!saved) return NotFound();
        return NoContent();
    }

    [HttpPost("budgets/apply-suggested")]
    public async Task<ActionResult<int>> ApplySuggested([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var applied = await _mediator.Send(new ApplySuggestedBudgetsCommand(GetUserId(), monthStart, now));
        return Ok(applied);
    }
}

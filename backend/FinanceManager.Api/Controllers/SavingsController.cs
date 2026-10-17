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

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// The plan for the month starting at <paramref name="start"/> (the user's local first day),
    /// as of <paramref name="end"/>; defaults to the current UTC month.
    /// </summary>
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
        try
        {
            await _mediator.Send(new SetSavingsGoalCommand(GetUserId(), request.MonthlyGoalCents));
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("budgets/{categoryId}")]
    public async Task<IActionResult> SetBudget(Guid categoryId, [FromBody] CategoryBudgetRequest request)
    {
        try
        {
            var saved = await _mediator.Send(new SetCategoryBudgetCommand(GetUserId(), categoryId, request.LimitCents));
            if (!saved) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Sets every category to its suggested limit.</summary>
    [HttpPost("budgets/apply-suggested")]
    public async Task<ActionResult<int>> ApplySuggested([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var applied = await _mediator.Send(new ApplySuggestedBudgetsCommand(GetUserId(), monthStart, now));
        return Ok(applied);
    }
}

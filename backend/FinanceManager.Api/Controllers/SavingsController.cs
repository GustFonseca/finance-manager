using System.Security.Claims;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetWorkHours;
using FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/savings")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class SavingsController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<SavingsPlanDto>> Get([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var plan = await Mediator.Send(new GetSavingsPlanQuery(UserId, monthStart, now));
        return Ok(plan);
    }

    [HttpPut("goal")]
    public async Task<IActionResult> SetGoal([FromBody] SavingsGoalRequest request)
    {
        await Mediator.Send(new SetSavingsGoalCommand(UserId, request.MonthlyGoalCents));
        return NoContent();
    }

    [HttpPut("work-hours")]
    public async Task<IActionResult> SetWorkHours([FromBody] WorkHoursRequest request)
    {
        await Mediator.Send(new SetWorkHoursCommand(UserId, request.Hours));
        return NoContent();
    }

    [HttpPut("budgets/{categoryId}")]
    public async Task<IActionResult> SetBudget(Guid categoryId, [FromBody] CategoryBudgetRequest request)
    {
        await Mediator.Send(new SetCategoryBudgetCommand(UserId, categoryId, request.LimitCents));
        return NoContent();
    }

    [HttpPost("budgets/apply-suggested")]
    public async Task<ActionResult<int>> ApplySuggested([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (monthStart, now) = MonthPeriod.Resolve(start, end);
        var applied = await Mediator.Send(new ApplySuggestedBudgetsCommand(UserId, monthStart, now));
        return Ok(applied);
    }
}

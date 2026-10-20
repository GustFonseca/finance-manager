using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;
using FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/goals")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class GoalsController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll()
    {
        var goals = await Mediator.Send(new GetAllGoalsQuery(UserId));
        return Ok(goals);
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create([FromBody] CreateGoalRequest request)
    {
        var goal = await Mediator.Send(new CreateGoalCommand(UserId, request.Name, request.TargetCents, request.Deadline));
        return Created($"/api/goals/{goal.Id}", goal);
    }

    [HttpPut("{id}/progress")]
    public async Task<ActionResult<GoalDto>> UpdateProgress(Guid id, [FromBody] UpdateGoalProgressRequest request)
    {
        var goal = await Mediator.Send(new UpdateGoalProgressCommand(UserId, id, request.AmountCents));
        return Ok(goal);
    }

    [HttpPut("{id}/complete")]
    public async Task<ActionResult<GoalDto>> Complete(Guid id)
    {
        var goal = await Mediator.Send(new CompleteGoalCommand(UserId, id));
        return Ok(goal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteGoalCommand(UserId, id));
        return NoContent();
    }
}

using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;
using FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/goals")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GoalsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll()
    {
        var goals = await _mediator.Send(new GetAllGoalsQuery(GetUserId()));
        return Ok(goals);
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create([FromBody] CreateGoalRequest request)
    {
        var goal = await _mediator.Send(new CreateGoalCommand(GetUserId(), request.Name, request.TargetCents, request.Deadline));
        return Created($"/api/goals/{goal.Id}", goal);
    }

    [HttpPut("{id}/progress")]
    public async Task<ActionResult<GoalDto>> UpdateProgress(Guid id, [FromBody] UpdateGoalProgressRequest request)
    {
        try
        {
            var goal = await _mediator.Send(new UpdateGoalProgressCommand(GetUserId(), id, request.AmountCents));
            return Ok(goal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/complete")]
    public async Task<ActionResult<GoalDto>> Complete(Guid id)
    {
        try
        {
            var goal = await _mediator.Send(new CompleteGoalCommand(GetUserId(), id));
            return Ok(goal);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _mediator.Send(new DeleteGoalCommand(GetUserId(), id));
        if (!deleted) return NotFound();
        return NoContent();
    }
}

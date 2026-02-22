using System.Security.Claims;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using FinanceManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/goals")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly GoalService _goalService;

    public GoalsController(GoalService goalService)
    {
        _goalService = goalService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll()
    {
        var goals = await _goalService.GetAll(GetUserId());

        var dtos = goals.Select(g => new GoalDto
        {
            Id = g.Id,
            Name = g.Name,
            TargetCents = g.TargetCents,
            CurrentCents = g.CurrentCents,
            Deadline = g.Deadline,
            Status = g.Status,
            ProgressPercent = g.TargetCents > 0 ? Math.Round((double)g.CurrentCents / g.TargetCents * 100, 1) : 0
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create([FromBody] CreateGoalRequest request)
    {
        var goal = await _goalService.Create(GetUserId(), request);
        return Created($"/api/goals/{goal.Id}", new GoalDto
        {
            Id = goal.Id,
            Name = goal.Name,
            TargetCents = goal.TargetCents,
            CurrentCents = goal.CurrentCents,
            Deadline = goal.Deadline,
            Status = goal.Status,
            ProgressPercent = 0
        });
    }

    [HttpPut("{id}/progress")]
    public async Task<ActionResult<GoalDto>> UpdateProgress(Guid id, [FromBody] UpdateGoalProgressRequest request)
    {
        try
        {
            var goal = await _goalService.UpdateProgress(GetUserId(), id, request.AmountCents);
            return Ok(new GoalDto
            {
                Id = goal.Id,
                Name = goal.Name,
                TargetCents = goal.TargetCents,
                CurrentCents = goal.CurrentCents,
                Deadline = goal.Deadline,
                Status = goal.Status,
                ProgressPercent = goal.TargetCents > 0 ? Math.Round((double)goal.CurrentCents / goal.TargetCents * 100, 1) : 0
            });
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
            var goal = await _goalService.Complete(GetUserId(), id);
            return Ok(new GoalDto
            {
                Id = goal.Id,
                Name = goal.Name,
                TargetCents = goal.TargetCents,
                CurrentCents = goal.CurrentCents,
                Deadline = goal.Deadline,
                Status = goal.Status,
                ProgressPercent = goal.TargetCents > 0 ? Math.Round((double)goal.CurrentCents / goal.TargetCents * 100, 1) : 0
            });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

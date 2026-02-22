using FinanceManager.Api.Data;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Api.Services;

public class GoalService
{
    private readonly AppDbContext _db;

    public GoalService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Goal> Create(Guid userId, CreateGoalRequest request)
    {
        var goal = new Goal
        {
            UserId = userId,
            Name = request.Name,
            TargetCents = request.TargetCents,
            Deadline = request.Deadline,
            Status = GoalStatus.ACTIVE
        };

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();
        return goal;
    }

    public async Task<Goal> UpdateProgress(Guid userId, Guid goalId, long amountCents)
    {
        var goal = await _db.Goals.FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId)
            ?? throw new InvalidOperationException("Goal not found");

        if (goal.Status != GoalStatus.ACTIVE)
            throw new InvalidOperationException("Goal is not active");

        goal.CurrentCents += amountCents;

        // Auto-complete when target is reached
        if (goal.CurrentCents >= goal.TargetCents)
            goal.Status = GoalStatus.COMPLETED;

        await _db.SaveChangesAsync();
        return goal;
    }

    public async Task<Goal> Complete(Guid userId, Guid goalId)
    {
        var goal = await _db.Goals.FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId)
            ?? throw new InvalidOperationException("Goal not found");

        goal.Status = GoalStatus.COMPLETED;
        await _db.SaveChangesAsync();
        return goal;
    }

    public async Task<List<Goal>> GetAll(Guid userId)
    {
        return await _db.Goals
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }
}

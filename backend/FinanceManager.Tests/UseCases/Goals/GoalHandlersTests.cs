using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;
using FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Goals;

public class GoalHandlersTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly AppDbContext _db = TestDb.InMemory();

    private GoalRepository Goals => new(_db);

    private Goal AddGoal(Guid userId, long target, long current = 0, GoalStatus status = GoalStatus.ACTIVE, DateTime? createdAt = null)
    {
        var goal = new Goal { UserId = userId, Name = "Viagem", TargetCents = target, CurrentCents = current, Status = status };
        if (createdAt != null) goal.CreatedAt = createdAt.Value;
        _db.Goals.Add(goal);
        _db.SaveChanges();
        return goal;
    }

    [Fact]
    public async Task CreateGoal_starts_active_with_no_progress()
    {
        var deadline = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var dto = await new CreateGoalHandler(Goals, TestDb.Mapper).Handle(new CreateGoalCommand(Me, "Viagem", 500000, deadline));

        var saved = Assert.Single(_db.Goals);
        Assert.Equal(saved.Id, dto.Id);
        Assert.Equal(GoalStatus.ACTIVE, dto.Status);
        Assert.Equal(0, dto.ProgressPercent);
        Assert.Equal(deadline, dto.Deadline);
        Assert.Equal(500000, saved.TargetCents);
    }

    [Fact]
    public async Task GetAllGoals_returns_the_users_goals_newest_first_with_progress()
    {
        AddGoal(Me, 10000, 2500, createdAt: DateTime.UtcNow.AddDays(-2));
        AddGoal(Me, 0, createdAt: DateTime.UtcNow);
        AddGoal(SomeoneElse, 10000);

        var goals = await new GetAllGoalsHandler(Goals, TestDb.Mapper).Handle(new GetAllGoalsQuery(Me));

        Assert.Equal([0, 25.0], goals.Select(g => g.ProgressPercent));
    }

    [Fact]
    public async Task UpdateGoalProgress_adds_the_amount_and_keeps_the_goal_active_below_the_target()
    {
        var goal = AddGoal(Me, 30000, 10000);

        var dto = await new UpdateGoalProgressHandler(Goals, TestDb.Mapper).Handle(new UpdateGoalProgressCommand(Me, goal.Id, 5000));

        Assert.Equal(15000, dto.CurrentCents);
        Assert.Equal(50.0, dto.ProgressPercent);
        Assert.Equal(GoalStatus.ACTIVE, dto.Status);
    }

    [Fact]
    public async Task UpdateGoalProgress_completes_the_goal_when_the_target_is_reached()
    {
        var goal = AddGoal(Me, 10000, 9000);

        var dto = await new UpdateGoalProgressHandler(Goals, TestDb.Mapper).Handle(new UpdateGoalProgressCommand(Me, goal.Id, 2000));

        Assert.Equal(GoalStatus.COMPLETED, dto.Status);
        Assert.Equal(110.0, dto.ProgressPercent);
    }

    [Fact]
    public async Task UpdateGoalProgress_with_a_zero_target_reports_zero_percent()
    {
        var goal = AddGoal(Me, 0);

        var dto = await new UpdateGoalProgressHandler(Goals, TestDb.Mapper).Handle(new UpdateGoalProgressCommand(Me, goal.Id, 100));

        Assert.Equal(0, dto.ProgressPercent);
    }

    [Fact]
    public async Task UpdateGoalProgress_rejects_missing_foreign_and_inactive_goals()
    {
        var foreign = AddGoal(SomeoneElse, 10000);
        var done = AddGoal(Me, 10000, status: GoalStatus.COMPLETED);
        var handler = new UpdateGoalProgressHandler(Goals, TestDb.Mapper);

        var missing = await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateGoalProgressCommand(Me, Guid.NewGuid(), 1)));
        var notMine = await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateGoalProgressCommand(Me, foreign.Id, 1)));
        var inactive = await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new UpdateGoalProgressCommand(Me, done.Id, 1)));

        Assert.Equal("Meta não encontrada.", missing.Message);
        Assert.Equal("Meta não encontrada.", notMine.Message);
        Assert.Equal("A meta não está ativa.", inactive.Message);
    }

    [Fact]
    public async Task CompleteGoal_marks_the_goal_as_completed()
    {
        var goal = AddGoal(Me, 20000, 5000);

        var dto = await new CompleteGoalHandler(Goals, TestDb.Mapper).Handle(new CompleteGoalCommand(Me, goal.Id));

        Assert.Equal(GoalStatus.COMPLETED, dto.Status);
        Assert.Equal(25.0, dto.ProgressPercent);
        Assert.Equal(GoalStatus.COMPLETED, (await Goals.GetByIdAsync(goal.Id))!.Status);
    }

    [Fact]
    public async Task CompleteGoal_with_a_zero_target_reports_zero_percent()
    {
        var goal = AddGoal(Me, 0);

        var dto = await new CompleteGoalHandler(Goals, TestDb.Mapper).Handle(new CompleteGoalCommand(Me, goal.Id));

        Assert.Equal(0, dto.ProgressPercent);
    }

    [Fact]
    public async Task CompleteGoal_rejects_missing_and_foreign_goals()
    {
        var foreign = AddGoal(SomeoneElse, 10000);
        var handler = new CompleteGoalHandler(Goals, TestDb.Mapper);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new CompleteGoalCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new CompleteGoalCommand(Me, foreign.Id)));
        Assert.Equal(GoalStatus.ACTIVE, foreign.Status);
    }

    [Fact]
    public async Task DeleteGoal_removes_only_the_users_goal()
    {
        var mine = AddGoal(Me, 10000);
        var foreign = AddGoal(SomeoneElse, 10000);
        var handler = new DeleteGoalHandler(Goals);

        Assert.True(await handler.Handle(new DeleteGoalCommand(Me, mine.Id)));
        Assert.False(await handler.Handle(new DeleteGoalCommand(Me, foreign.Id)));
        Assert.False(await handler.Handle(new DeleteGoalCommand(Me, Guid.NewGuid())));
        Assert.Equal([foreign.Id], _db.Goals.Select(g => g.Id));
    }
}

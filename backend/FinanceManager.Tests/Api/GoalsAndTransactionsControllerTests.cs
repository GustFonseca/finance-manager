using FinanceManager.Aplication.Exceptions;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;
using FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;
using FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.UpdateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;
using FinanceManager.Domain.Enuns;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.Api;

public class GoalsAndTransactionsControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid Known = Guid.NewGuid();

    private readonly FakeMediator _mediator = new();

    private GoalsController Goals => new GoalsController(_mediator).SignedIn(Me);
    private TransactionsController Transactions => new TransactionsController(_mediator).SignedIn(Me);

    private static object? Property(object value, string name) => value.GetType().GetProperty(name)!.GetValue(value);

    [Fact]
    public async Task Goals_GetAll_and_Create()
    {
        var goals = new List<GoalDto>();
        var deadline = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        _mediator.Returns<GetAllGoalsQuery>(_ => goals);
        _mediator.Returns<CreateGoalCommand>(c => new GoalDto { Id = Known, Name = c.Name });

        var all = await Goals.GetAll();
        var created = await Goals.Create(new CreateGoalRequest { Name = "Viagem", TargetCents = 1000, Deadline = deadline });

        Assert.Same(goals, Assert.IsType<OkObjectResult>(all.Result).Value);
        Assert.Equal($"/api/goals/{Known}", Assert.IsType<CreatedResult>(created.Result).Location);
        Assert.Equal(new CreateGoalCommand(Me, "Viagem", 1000, deadline), _mediator.Sent[1]);
    }

    [Fact]
    public async Task Goals_progress_and_complete_return_the_goal()
    {
        _mediator.Returns<UpdateGoalProgressCommand>(c => new GoalDto { Id = c.GoalId, CurrentCents = c.AmountCents });
        _mediator.Returns<CompleteGoalCommand>(c => new GoalDto { Id = c.GoalId, Status = GoalStatus.COMPLETED });

        var progress = await Goals.UpdateProgress(Known, new UpdateGoalProgressRequest { AmountCents = 500 });
        var complete = await Goals.Complete(Known);

        Assert.Equal(500, Assert.IsType<GoalDto>(Assert.IsType<OkObjectResult>(progress.Result).Value).CurrentCents);
        Assert.Equal(GoalStatus.COMPLETED, Assert.IsType<GoalDto>(Assert.IsType<OkObjectResult>(complete.Result).Value).Status);
        Assert.Equal(new UpdateGoalProgressCommand(Me, Known, 500), _mediator.Sent[0]);
        Assert.Equal(new CompleteGoalCommand(Me, Known), _mediator.Sent[1]);
    }

    [Fact]
    public async Task Goals_Delete_returns_204_or_404()
    {
        _mediator.Returns<DeleteGoalCommand>(c => c.GoalId == Known ? true : throw new NotFoundException("não encontrado"));

        Assert.IsType<NoContentResult>(await Goals.Delete(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Goals.Delete(Guid.NewGuid()));
    }

    [Fact]
    public async Task Transactions_GetAll_converts_the_period_to_utc()
    {
        var transactions = new List<TransactionDto>();
        var start = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Local);
        var end = new DateTime(2026, 10, 31, 23, 59, 59, DateTimeKind.Utc);
        var account = Guid.NewGuid();
        _mediator.Returns<GetTransactionsByDateRangeQuery>(_ => transactions);

        var category = Guid.NewGuid();
        var result = await Transactions.GetAll(start, end, account, Known, category, TransactionType.EXPENSE, "ifood", 5);
        var unfiltered = await Transactions.GetAll(null, null, null, null, null, null, null, null);

        Assert.Same(transactions, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetTransactionsByDateRangeQuery(Me, start.ToUniversalTime(), end, account, Known, category, TransactionType.EXPENSE, "ifood", 5), _mediator.Sent[0]);
        Assert.Equal(new GetTransactionsByDateRangeQuery(Me, null, null, null, null, null, null, null), _mediator.Sent[1]);
        Assert.IsType<OkObjectResult>(unfiltered.Result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public async Task Transactions_GetAll_rejects_limits_out_of_range(int limit)
    {
        var result = await Transactions.GetAll(null, null, null, null, null, null, null, limit);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(_mediator.Sent);
    }

    [Fact]
    public async Task Transactions_Update_sends_the_whole_transaction()
    {
        var date = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();
        var request = new CreateTransactionRequest
        {
            AccountId = Guid.NewGuid(), CategoryId = Guid.NewGuid(), Type = TransactionType.INCOME,
            AmountCents = 900, Description = "Estorno", Date = date, Recurrence = Recurrence.MONTHLY,
        };
        var updated = new TransactionDto { Id = id };
        _mediator.Returns<UpdateTransactionCommand>(_ => updated);

        var result = await Transactions.Update(id, request);

        Assert.Same(updated, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(
            new UpdateTransactionCommand(Me, id, request.AccountId, request.CategoryId, TransactionType.INCOME, 900, "Estorno", date, Recurrence.MONTHLY),
            Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Transactions_Create_returns_201_with_the_location()
    {
        var date = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);
        var request = new CreateTransactionRequest
        {
            AccountId = Guid.NewGuid(), CategoryId = Guid.NewGuid(), Type = TransactionType.EXPENSE,
            AmountCents = 1000, Description = "Cinema", Date = date, Recurrence = Recurrence.MONTHLY,
        };
        _mediator.Returns<CreateTransactionCommand>(_ => new TransactionDto { Id = Known });

        var result = await Transactions.Create(request);

        Assert.Equal($"/api/transactions/{Known}", Assert.IsType<CreatedResult>(result.Result).Location);
        Assert.Equal(
            new CreateTransactionCommand(Me, request.AccountId, request.CategoryId, TransactionType.EXPENSE, 1000, "Cinema", date, Recurrence.MONTHLY),
            Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Transactions_Delete_returns_204()
    {
        var result = await Transactions.Delete(Known);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(new DeleteTransactionCommand(Me, Known), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Transactions_Import_and_DeleteAll_return_the_counts()
    {
        var lines = new List<ImportTransactionLine> { new() { Description = "x", AmountCents = 1 } };
        _mediator.Returns<ImportTransactionsCommand>(c => c.Lines.Count);
        _mediator.Returns<DeleteAllTransactionsCommand>(_ => 7);

        var imported = await Transactions.Import(new ImportTransactionsRequest { AccountId = Known, Lines = lines });
        var deleted = await Transactions.DeleteAll();

        Assert.Equal(1, Property(Assert.IsType<OkObjectResult>(imported.Result).Value!, "imported"));
        Assert.Equal(7, Property(Assert.IsType<OkObjectResult>(deleted.Result).Value!, "deleted"));
        var import = Assert.IsType<ImportTransactionsCommand>(_mediator.Sent[0]);
        Assert.Equal((Me, Known), (import.UserId, import.AccountId));
        Assert.Same(lines, import.Lines);
        Assert.Equal(new DeleteAllTransactionsCommand(Me), _mediator.Sent[1]);
    }
}

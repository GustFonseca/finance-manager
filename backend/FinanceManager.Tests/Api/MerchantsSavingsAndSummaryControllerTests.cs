using FinanceManager.Aplication.Exceptions;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetUnsortedMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;
using FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetAvoidableSpending;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetCashFlowForecast;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;
using FinanceManager.Domain.Enuns;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.Api;

public class MerchantsSavingsAndSummaryControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid Known = Guid.NewGuid();
    private static readonly DateTime Start = new(2025, 9, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime End = new(2025, 9, 30, 23, 0, 0, DateTimeKind.Utc);

    private readonly FakeMediator _mediator = new();

    private MerchantsController Merchants => new MerchantsController(_mediator).SignedIn(Me);
    private SavingsController Savings => new SavingsController(_mediator).SignedIn(Me);
    private SummaryController Summary => new SummaryController(_mediator).SignedIn(Me);

    [Fact]
    public async Task Merchants_GetAll_returns_the_catalog()
    {
        var merchants = new List<MerchantDto>();
        _mediator.Returns<GetMerchantsQuery>(_ => merchants);

        var result = await Merchants.GetAll();

        Assert.Same(merchants, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetMerchantsQuery(Me), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Merchants_Resolve_rejects_more_than_2000_lines()
    {
        var request = new ResolveMerchantsRequest { Lines = Enumerable.Range(0, 2001).Select(_ => new ImportLineRequest()).ToList() };

        var result = await Merchants.Resolve(request);

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("No máximo 2000 linhas por vez", bad.Value!.GetType().GetProperty("message")!.GetValue(bad.Value));
        Assert.Empty(_mediator.Sent);
    }

    [Fact]
    public async Task Merchants_Resolve_returns_the_matches()
    {
        var matches = new List<MerchantMatchDto>();
        var lines = new List<ImportLineRequest> { new() { Description = "iFood" } };
        _mediator.Returns<ResolveMerchantsQuery>(_ => matches);

        var result = await Merchants.Resolve(new ResolveMerchantsRequest { Lines = lines });

        Assert.Same(matches, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Same(lines, Assert.IsType<ResolveMerchantsQuery>(Assert.Single(_mediator.Sent)).Lines);
    }

    [Fact]
    public async Task Merchants_Update_returns_200_or_404()
    {
        var category = Guid.NewGuid();
        _mediator.Returns<UpdateMerchantCommand>(c => c.MerchantId == Known ? new UpdateMerchantResultDto { UpdatedTransactions = 2 } : throw new NotFoundException("não encontrado"));
        var request = new UpdateMerchantRequest { Name = "iFood", Kind = MerchantKind.BUSINESS, CategoryId = category, ApplyToTransactions = true };

        var found = await Merchants.Update(Known, request);

        Assert.Equal(2, Assert.IsType<UpdateMerchantResultDto>(Assert.IsType<OkObjectResult>(found.Result).Value).UpdatedTransactions);
        await Assert.ThrowsAsync<NotFoundException>(() => Merchants.Update(Guid.NewGuid(), request));
        Assert.Equal(new UpdateMerchantCommand(Me, Known, "iFood", MerchantKind.BUSINESS, category, true), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Merchants_SetClass_returns_200_or_404()
    {
        var dto = new MerchantDto { Id = Known, Class = SpendingClass.ESSENTIAL };
        _mediator.Returns<SetMerchantClassCommand>(c => c.MerchantId == Known ? dto : throw new NotFoundException("não encontrado"));

        var found = await Merchants.SetClass(Known, new SetMerchantClassRequest { Class = SpendingClass.ESSENTIAL });

        Assert.Same(dto, Assert.IsType<OkObjectResult>(found.Result).Value);
        await Assert.ThrowsAsync<NotFoundException>(() => Merchants.SetClass(Guid.NewGuid(), new SetMerchantClassRequest()));
        Assert.Equal(new SetMerchantClassCommand(Me, Known, SpendingClass.ESSENTIAL), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Merchants_GetUnsorted_uses_the_requested_period()
    {
        var unsorted = new List<MerchantSpendingDto>();
        _mediator.Returns<GetUnsortedMerchantsQuery>(_ => unsorted);

        var result = await Merchants.GetUnsorted(Start, End);

        Assert.Same(unsorted, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetUnsortedMerchantsQuery(Me, Start, End), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Merchants_GetSpending_uses_the_requested_period()
    {
        var report = new MerchantSpendingReportDto();
        var account = Guid.NewGuid();
        _mediator.Returns<GetMerchantSpendingQuery>(_ => report);

        var result = await Merchants.GetSpending(Start, End, account);

        Assert.Same(report, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetMerchantSpendingQuery(Me, Start, End, account), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Merchants_GetHistory_returns_200_or_404()
    {
        var history = new MerchantHistoryDto();
        _mediator.Returns<GetMerchantHistoryQuery>(q => q.MerchantId == Known ? history : throw new NotFoundException("não encontrado"));

        var found = await Merchants.GetHistory(Known, Start, End);

        Assert.Same(history, Assert.IsType<OkObjectResult>(found.Result).Value);
        await Assert.ThrowsAsync<NotFoundException>(() => Merchants.GetHistory(Guid.NewGuid(), Start, End));
        Assert.Equal(new GetMerchantHistoryQuery(Me, Known, Start, End), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Savings_Get_returns_the_plan_for_the_period()
    {
        var plan = new SavingsPlanDto();
        _mediator.Returns<GetSavingsPlanQuery>(_ => plan);

        var result = await Savings.Get(Start, End);

        Assert.Same(plan, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetSavingsPlanQuery(Me, Start, End), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Savings_SetGoal_returns_204()
    {
        _mediator.Returns<SetSavingsGoalCommand>(c => c.MonthlyGoalCents);

        var result = await Savings.SetGoal(new SavingsGoalRequest { MonthlyGoalCents = 50000 });

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(new SetSavingsGoalCommand(Me, 50000), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Savings_SetBudget_returns_204_or_404()
    {
        _mediator.Returns<SetCategoryBudgetCommand>(c => c.CategoryId == Known ? true : throw new NotFoundException("não encontrado"));

        Assert.IsType<NoContentResult>(await Savings.SetBudget(Known, new CategoryBudgetRequest { LimitCents = 100 }));
        await Assert.ThrowsAsync<NotFoundException>(() => Savings.SetBudget(Guid.NewGuid(), new CategoryBudgetRequest()));
        Assert.Equal(new SetCategoryBudgetCommand(Me, Known, 100), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Savings_ApplySuggested_returns_how_many_budgets_changed()
    {
        _mediator.Returns<ApplySuggestedBudgetsCommand>(_ => 4);

        var result = await Savings.ApplySuggested(Start, End);

        Assert.Equal(4, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new ApplySuggestedBudgetsCommand(Me, Start, End), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Summary_GetSummary_converts_the_period_to_utc()
    {
        var summary = new FinancialSummaryDto();
        var account = Guid.NewGuid();
        var localStart = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Local);
        _mediator.Returns<GetFinancialSummaryQuery>(_ => summary);

        var before = DateTime.UtcNow;

        var result = await Summary.GetSummary(localStart, End, account);
        await Summary.GetSummary(null, null, null);

        Assert.Same(summary, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetFinancialSummaryQuery(Me, localStart.ToUniversalTime(), End, account), _mediator.Sent[0]);
        var current = (GetFinancialSummaryQuery)_mediator.Sent[1];
        Assert.Equal(new DateTime(before.Year, before.Month, 1, 0, 0, 0, DateTimeKind.Utc), current.Start);
        Assert.True(current.End >= before && current.End < before.Date.AddDays(2));
    }

    [Fact]
    public async Task Summary_GetRecurring_uses_the_end_of_the_period_as_now()
    {
        var recurring = new List<RecurringExpenseDto>();
        _mediator.Returns<GetRecurringExpensesQuery>(_ => recurring);

        var result = await Summary.GetRecurring(End, Known);

        Assert.Same(recurring, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetRecurringExpensesQuery(Me, End, Known), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Summary_GetAvoidable_uses_the_requested_month()
    {
        var avoidable = new AvoidableSpendingDto();
        _mediator.Returns<GetAvoidableSpendingQuery>(_ => avoidable);

        var result = await Summary.GetAvoidable(Start, End, Known);

        Assert.Same(avoidable, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetAvoidableSpendingQuery(Me, Start, End, Known), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Summary_GetForecast_uses_the_requested_month()
    {
        var forecast = new CashFlowForecastDto();
        _mediator.Returns<GetCashFlowForecastQuery>(_ => forecast);

        var result = await Summary.GetForecast(Start, End, Known);

        Assert.Same(forecast, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetCashFlowForecastQuery(Me, Start, End, Known), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Summary_GetSpending_uses_the_requested_month()
    {
        var analysis = new SpendingAnalysisDto();
        _mediator.Returns<GetSpendingAnalysisQuery>(_ => analysis);

        var result = await Summary.GetSpending(Start, End, Known);

        Assert.Same(analysis, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetSpendingAnalysisQuery(Me, Start, End, Known), Assert.Single(_mediator.Sent));
    }
}

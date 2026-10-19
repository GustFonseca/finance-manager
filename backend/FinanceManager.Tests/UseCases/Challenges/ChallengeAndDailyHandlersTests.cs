using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Challenges.Commands.CreateChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Commands.DeleteChallenge;
using FinanceManager.Aplication.UseCases.Challenges.Queries.GetChallenges;
using FinanceManager.Aplication.UseCases.Savings.Commands.SetWorkHours;
using FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetDailyBudget;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.UseCases.Challenges;

public class ChallengeAndDailyHandlersTests
{
    private static readonly DateTime Now = new(2026, 10, 21, 18, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime MonthStart = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _account;
    private readonly Category _lazer;
    private readonly Category _salario;
    private readonly Merchant _toru;

    public ChallengeAndDailyHandlersTests()
    {
        _me = _db.AddUser();
        _account = _db.AddAccount(_me.Id);
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
        _toru = new Merchant { UserId = _me.Id, Name = "Toru", Key = "toru", Kind = MerchantKind.BUSINESS };
        _db.Merchants.Add(_toru);
        _db.SaveChanges();
    }

    private CreateChallengeHandler Create => new(new ChallengeRepository(_db), new CategoryRepository(_db), new MerchantRepository(_db));

    private CreateChallengeCommand Command(
        string name = "Sem cinema", ChallengeScope scope = ChallengeScope.CATEGORY, Guid? target = null,
        long limit = 0, int days = 7, DateTime? startsOn = null) =>
        new(_me.Id, name, scope, scope == ChallengeScope.CATEGORY && target == null ? _lazer.Id : target, limit,
            startsOn ?? new DateTime(2026, 10, 18, 3, 0, 0, DateTimeKind.Utc), days, Now);

    [Fact]
    public async Task Creating_a_challenge_saves_it_and_logs_it()
    {
        var dto = await Create.Handle(Command(name: "  Sem cinema  "));

        Assert.Equal("Sem cinema", dto.Name);
        Assert.Equal("Lazer", dto.TargetName);
        Assert.Equal(ChallengeStatus.ACTIVE, dto.Status);
        var saved = _db.Challenges.Single();
        Assert.Equal(_lazer.Id, saved.TargetId);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Desafio criado: Sem cinema (7 dias)");
    }

    [Fact]
    public async Task Merchant_and_superfluous_challenges_name_their_target()
    {
        var merchant = await Create.Handle(Command(scope: ChallengeScope.MERCHANT, target: _toru.Id));
        var superfluous = await Create.Handle(Command(scope: ChallengeScope.SUPERFLUOUS, target: _toru.Id));

        Assert.Equal("Toru", merchant.TargetName);
        Assert.Equal("Gastos supérfluos", superfluous.TargetName);
        Assert.Null(_db.Challenges.Single(c => c.Scope == ChallengeScope.SUPERFLUOUS).TargetId);
    }

    public static TheoryData<string, int, long, int> InvalidInputs => new()
    {
        { " ", 7, 0, 0 },
        { new string('a', 101), 7, 0, 0 },
        { "Ok", 0, 0, 0 },
        { "Ok", 91, 0, 0 },
        { "Ok", 7, -1, 0 },
        { "Ok", 7, 0, 91 },
    };

    [Theory]
    [MemberData(nameof(InvalidInputs))]
    public async Task Invalid_challenges_are_rejected(string name, int days, long limit, int startsInDays)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(name: name, days: days, limit: limit, startsOn: Now.AddDays(startsInDays))));
        Assert.Empty(_db.Challenges);
    }

    [Fact]
    public async Task Targets_must_exist_belong_to_the_user_and_fit_the_scope()
    {
        var other = _db.AddUser("Outra Pessoa");
        var foreign = _db.AddCategory(other.Id, "Lazer");

        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(target: _salario.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(target: foreign.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(target: Guid.NewGuid())));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(scope: ChallengeScope.MERCHANT, target: null)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(scope: ChallengeScope.MERCHANT, target: foreign.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(Command(scope: (ChallengeScope)99)));
        Assert.Empty(_db.Challenges);
    }

    [Fact]
    public async Task Challenges_are_listed_with_progress_and_removed_targets_are_named()
    {
        Assert.Empty(await new GetChallengesHandler(new ChallengeRepository(_db), new TransactionRepository(_db), new CategoryRepository(_db), new MerchantRepository(_db), TestRules.Provider)
            .Handle(new GetChallengesQuery(_me.Id, Now)));

        await Create.Handle(Command());
        await Create.Handle(Command(scope: ChallengeScope.MERCHANT, target: _toru.Id, days: 2));
        await Create.Handle(Command(scope: ChallengeScope.SUPERFLUOUS));
        _db.Challenges.Add(new Challenge { UserId = _me.Id, Name = "Velho", Scope = ChallengeScope.CATEGORY, TargetId = Guid.NewGuid(), StartsOn = Now.AddDays(-1), Days = 5 });
        _db.Challenges.Add(new Challenge { UserId = _me.Id, Name = "Loja", Scope = ChallengeScope.MERCHANT, TargetId = Guid.NewGuid(), StartsOn = Now.AddDays(-1), Days = 5 });
        _db.SaveChanges();
        _db.AddTransaction(_account, _lazer, 5000, new DateTime(2026, 10, 19, 12, 0, 0, DateTimeKind.Utc), "Cinema");

        var list = await new GetChallengesHandler(new ChallengeRepository(_db), new TransactionRepository(_db), new CategoryRepository(_db), new MerchantRepository(_db), TestRules.Provider)
            .Handle(new GetChallengesQuery(_me.Id, Now));

        Assert.Equal(5, list.Count);
        Assert.Equal(ChallengeStatus.ACTIVE, list[0].Status);
        Assert.Equal(ChallengeStatus.LOST, list[^1].Status);
        Assert.Contains(list, c => c.Status == ChallengeStatus.WON && c.TargetName == "Toru");
        Assert.Contains(list, c => c.TargetName == "Categoria removida");
        Assert.Contains(list, c => c.TargetName == "Estabelecimento removido");
        Assert.Contains(list, c => c.TargetName == "Gastos supérfluos");
    }

    [Fact]
    public async Task Only_the_owner_can_delete_a_challenge()
    {
        var dto = await Create.Handle(Command());
        var handler = new DeleteChallengeHandler(new ChallengeRepository(_db));

        Assert.False(await handler.Handle(new DeleteChallengeCommand(Guid.NewGuid(), dto.Id)));
        Assert.False(await handler.Handle(new DeleteChallengeCommand(_me.Id, Guid.NewGuid())));
        Assert.True(await handler.Handle(new DeleteChallengeCommand(_me.Id, dto.Id)));
        Assert.Empty(_db.Challenges);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Desafio excluído: Sem cinema");
    }

    [Fact]
    public async Task Work_hours_are_validated_saved_and_used_for_the_hour_value()
    {
        var handler = new SetWorkHoursHandler(new SavingsPlanRepository(_db));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetWorkHoursCommand(_me.Id, 0)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetWorkHoursCommand(_me.Id, 745)));

        Assert.Equal(160, await handler.Handle(new SetWorkHoursCommand(_me.Id, 160)));
        Assert.Equal(120, await handler.Handle(new SetWorkHoursCommand(_me.Id, 120)));

        Assert.Equal(120, _db.SavingsPlans.Single().WorkHoursPerMonth);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Horas de trabalho por mês definidas: 120h");

        _db.AddTransaction(_account, _salario, 600000, new DateTime(2026, 9, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa");
        var plan = await new GetSavingsPlanHandler(new TransactionRepository(_db), new CategoryRepository(_db), new CategoryBudgetRepository(_db), new SavingsPlanRepository(_db), TestRules.Provider)
            .Handle(new GetSavingsPlanQuery(_me.Id, MonthStart, Now));
        Assert.Equal(120, plan.WorkHoursPerMonth);
        Assert.Equal(5000, plan.HourValueCents);
    }

    [Fact]
    public async Task The_daily_budget_handler_loads_budgets_goal_and_hours()
    {
        _db.SavingsPlans.Add(new SavingsPlan { UserId = _me.Id, MonthlyGoalCents = 100000, WorkHoursPerMonth = 100 });
        _db.CategoryBudgets.Add(new CategoryBudget { UserId = _me.Id, CategoryId = _lazer.Id, LimitCents = 10000 });
        _db.SaveChanges();
        _db.AddTransaction(_account, _salario, 500000, new DateTime(2026, 10, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa");
        _db.AddTransaction(_account, _salario, 500000, new DateTime(2026, 9, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa");
        _db.AddTransaction(_account, _lazer, 9000, new DateTime(2026, 10, 6, 12, 0, 0, DateTimeKind.Utc), "Cinema");

        var result = await new GetDailyBudgetHandler(new TransactionRepository(_db), new CategoryRepository(_db), new CategoryBudgetRepository(_db), new SavingsPlanRepository(_db), TestRules.Provider)
            .Handle(new GetDailyBudgetQuery(_me.Id, MonthStart, Now, new DateTime(2026, 10, 21, 0, 0, 0, DateTimeKind.Utc)));

        Assert.Equal(100000, result.MonthlyGoalCents);
        Assert.Equal(5000, result.HourValueCents);
        Assert.Equal(500000 - 9000 - 100000, result.FreeToSpendCents);
        Assert.Equal(BudgetLevel.WARNING, Assert.Single(result.Budgets).Level);
    }

    [Fact]
    public async Task A_user_without_a_plan_gets_defaults()
    {
        var result = await new GetDailyBudgetHandler(new TransactionRepository(_db), new CategoryRepository(_db), new CategoryBudgetRepository(_db), new SavingsPlanRepository(_db), TestRules.Provider)
            .Handle(new GetDailyBudgetQuery(_me.Id, MonthStart, Now, Now.Date));

        Assert.Equal(0, result.MonthlyGoalCents);
        Assert.Equal(176, result.WorkHoursPerMonth);
        Assert.Empty(result.Budgets);
    }
}

public class ChallengeAndDailyControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime Start = new(2025, 9, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime End = new(2025, 9, 30, 23, 0, 0, DateTimeKind.Utc);

    private readonly FakeMediator _mediator = new();

    private ChallengesController Challenges => new ChallengesController(_mediator).SignedIn(Me);
    private SummaryController Summary => new SummaryController(_mediator).SignedIn(Me);
    private SavingsController Savings => new SavingsController(_mediator).SignedIn(Me);

    [Fact]
    public async Task GetAll_lists_the_challenges_of_the_user()
    {
        var list = new List<ChallengeDto>();
        _mediator.Returns<GetChallengesQuery>(_ => list);

        var result = await Challenges.GetAll();

        Assert.Same(list, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(Me, Assert.IsType<GetChallengesQuery>(Assert.Single(_mediator.Sent)).UserId);
    }

    [Fact]
    public async Task Create_returns_201_with_the_challenge()
    {
        var dto = new ChallengeDto { Id = Guid.NewGuid() };
        _mediator.Returns<CreateChallengeCommand>(_ => dto);
        var startsOn = new DateTime(2026, 10, 18, 3, 0, 0, DateTimeKind.Utc);

        var result = await Challenges.Create(new CreateChallengeRequest { Name = "Sem bar", Scope = ChallengeScope.SUPERFLUOUS, LimitCents = 100, StartsOn = startsOn, Days = 7 });

        var created = Assert.IsType<CreatedResult>(result.Result);
        Assert.Equal($"/api/challenges/{dto.Id}", created.Location);
        var sent = Assert.IsType<CreateChallengeCommand>(Assert.Single(_mediator.Sent));
        Assert.Equal(("Sem bar", ChallengeScope.SUPERFLUOUS, 100L, startsOn, 7, Me), (sent.Name, sent.Scope, sent.LimitCents, sent.StartsOn, sent.Days, sent.UserId));
    }

    [Fact]
    public async Task Delete_returns_204_or_404()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<DeleteChallengeCommand>(c => c.ChallengeId == id);

        Assert.IsType<NoContentResult>(await Challenges.Delete(id));
        Assert.IsType<NotFoundResult>(await Challenges.Delete(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetDaily_uses_the_local_day_start_and_defaults_to_the_local_day_of_the_period()
    {
        var dto = new DailyBudgetDto();
        _mediator.Returns<GetDailyBudgetQuery>(_ => dto);
        var dayStart = new DateTime(2025, 9, 20, 3, 0, 0, DateTimeKind.Utc);

        var result = await Summary.GetDaily(Start, End, dayStart);
        await Summary.GetDaily(Start, End, null);
        await Summary.GetDaily(Start, End, End.AddDays(5));

        Assert.Same(dto, Assert.IsType<OkObjectResult>(result.Result).Value);
        var sent = _mediator.Sent.Cast<GetDailyBudgetQuery>().ToList();
        Assert.Equal(new GetDailyBudgetQuery(Me, Start, End, dayStart), sent[0]);
        Assert.Equal(new DateTime(2025, 9, 30, 3, 0, 0, DateTimeKind.Utc), sent[1].DayStart);
        Assert.Equal(End, sent[2].DayStart);
    }

    [Fact]
    public async Task SetWorkHours_returns_204()
    {
        Assert.IsType<NoContentResult>(await Savings.SetWorkHours(new WorkHoursRequest { Hours = 150 }));
        Assert.Equal(new SetWorkHoursCommand(Me, 150), Assert.Single(_mediator.Sent));
    }
}

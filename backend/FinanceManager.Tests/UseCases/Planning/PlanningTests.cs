using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Debts.Commands.DeleteDebt;
using FinanceManager.Aplication.UseCases.Debts.Commands.SaveDebt;
using FinanceManager.Aplication.UseCases.Debts.Queries.GetDebtPlan;
using FinanceManager.Aplication.UseCases.Debts.Queries.GetDebts;
using FinanceManager.Aplication.UseCases.Planning.Commands.SetEmergencyFund;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetEmergencyFund;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetNetWorth;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetSeasonalExpenses;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.CreateWish;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.DecideWish;
using FinanceManager.Aplication.UseCases.Wishlist.Commands.DeleteWish;
using FinanceManager.Aplication.UseCases.Wishlist.Queries.GetWishlist;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.UseCases.Planning;

public class WishlistTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;

    public WishlistTests()
    {
        _me = _db.AddUser();
    }

    private CreateWishHandler Create => new(new WishlistRepository(_db));
    private DecideWishHandler Decide => new(new WishlistRepository(_db));

    [Fact]
    public async Task A_wish_waits_48_hours_and_giving_up_counts_as_savings()
    {
        var wish = await Create.Handle(new CreateWishCommand(_me.Id, " Fone novo ", 45000, " https://loja.com/fone ", Now));

        Assert.Equal(("Fone novo", "https://loja.com/fone", Now.AddHours(48), false), (wish.Name, wish.Link, wish.DecideAfter, wish.ReadyToDecide));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Decide.Handle(new DecideWishCommand(_me.Id, wish.Id, WishStatus.BOUGHT, Now.AddHours(1))));

        var gaveUp = await Decide.Handle(new DecideWishCommand(_me.Id, wish.Id, WishStatus.GAVE_UP, Now.AddHours(1)));
        Assert.Equal((WishStatus.GAVE_UP, (DateTime?)Now.AddHours(1)), (gaveUp!.Status, gaveUp.DecidedAt));
        var back = await Decide.Handle(new DecideWishCommand(_me.Id, wish.Id, WishStatus.WAITING, Now.AddHours(2)));
        Assert.Null(back!.DecidedAt);
        var bought = await Decide.Handle(new DecideWishCommand(_me.Id, wish.Id, WishStatus.BOUGHT, Now.AddHours(49)));
        Assert.Equal(WishStatus.BOUGHT, bought!.Status);

        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Desejo anotado: Fone novo"));
        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Desistiu de Fone novo"));
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Fone novo voltou para a lista de espera");
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Comprou Fone novo depois de esperar");
    }

    [Theory]
    [InlineData(" ", 100, null)]
    [InlineData("x", 0, null)]
    [InlineData("x", 100, "ftp://loja.com")]
    [InlineData("x", 100, "não é link")]
    public async Task Invalid_wishes_are_rejected(string name, long price, string? link)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(new CreateWishCommand(_me.Id, name, price, link, Now)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(new CreateWishCommand(_me.Id, new string('n', 151), 100, null, Now)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Create.Handle(new CreateWishCommand(_me.Id, "x", 100, "https://" + new string('a', 500), Now)));
    }

    [Fact]
    public async Task The_list_puts_ready_wishes_first_and_sums_what_was_saved()
    {
        var account = _db.AddAccount(_me.Id);
        var salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
        _db.AddTransaction(account, salario, 352000, new DateTime(2026, 9, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa");
        var old = await Create.Handle(new CreateWishCommand(_me.Id, "Tênis", 30000, null, Now.AddDays(-3)));
        var fresh = await Create.Handle(new CreateWishCommand(_me.Id, "Jogo", 20000, null, Now));
        var gaveUp = await Create.Handle(new CreateWishCommand(_me.Id, "Relógio", 80000, null, Now.AddDays(-5)));
        await Decide.Handle(new DecideWishCommand(_me.Id, gaveUp.Id, WishStatus.GAVE_UP, Now));

        var list = await new GetWishlistHandler(new WishlistRepository(_db), new TransactionRepository(_db), new SavingsPlanRepository(_db), TestRules.Provider)
            .Handle(new GetWishlistQuery(_me.Id, Now));

        Assert.Equal([old.Id, fresh.Id, gaveUp.Id], list.Items.Select(i => i.Id));
        Assert.True(list.Items[0].ReadyToDecide);
        Assert.Equal(80000, list.SavedCents);
        Assert.Equal(50000, list.WaitingCents);
        Assert.Equal(2000, list.HourValueCents);
        Assert.Equal(48, list.WaitHours);
    }

    [Fact]
    public async Task Only_the_owner_can_decide_or_delete_and_bad_decisions_are_rejected()
    {
        var wish = await Create.Handle(new CreateWishCommand(_me.Id, "Tênis", 30000, null, Now));
        var delete = new DeleteWishHandler(new WishlistRepository(_db));

        await Assert.ThrowsAsync<NotFoundException>(() => Decide.Handle(new DecideWishCommand(Guid.NewGuid(), wish.Id, WishStatus.GAVE_UP, Now)));
        await Assert.ThrowsAsync<NotFoundException>(() => Decide.Handle(new DecideWishCommand(_me.Id, Guid.NewGuid(), WishStatus.GAVE_UP, Now)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => Decide.Handle(new DecideWishCommand(_me.Id, wish.Id, (WishStatus)9, Now)));
        await Assert.ThrowsAsync<NotFoundException>(() => delete.Handle(new DeleteWishCommand(Guid.NewGuid(), wish.Id)));
        await delete.Handle(new DeleteWishCommand(_me.Id, wish.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => delete.Handle(new DeleteWishCommand(_me.Id, wish.Id)));
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Desejo removido: Tênis");
    }
}

public class DebtTests
{
    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;

    public DebtTests()
    {
        _me = _db.AddUser();
    }

    private static Debt Debt(string name, long balance, decimal rate, long minimum) =>
        new() { Name = name, BalanceCents = balance, MonthlyRatePercent = rate, MinimumPaymentCents = minimum };

    [Fact]
    public void Avalanche_pays_less_interest_and_snowball_clears_small_debts_first()
    {
        var plan = DebtPlanner.Plan([Debt("Cartão", 500000, 12m, 30000), Debt("Empréstimo", 100000, 2m, 10000), Debt("Zerada", 0, 1m, 100)], 50000);

        Assert.Equal(40000 + 50000, plan.MonthlyBudgetCents);
        Assert.Equal(50000, plan.ExtraCents);
        Assert.True(plan.Avalanche.Feasible);
        Assert.True(plan.Avalanche.Months <= plan.Snowball.Months);
        Assert.Equal("Empréstimo", plan.Snowball.Order[0].Name);
        Assert.True(plan.Avalanche.TotalInterestCents < plan.Snowball.TotalInterestCents);
        Assert.Equal(plan.Snowball.TotalInterestCents - plan.Avalanche.TotalInterestCents, plan.InterestSavedWithAvalancheCents);
        Assert.Equal(2, plan.Avalanche.Order.Count);
    }

    [Fact]
    public void A_payment_below_the_interest_never_ends_and_negative_extra_is_ignored()
    {
        var plan = DebtPlanner.Plan([Debt("Rotativo", 1000000, 15m, 10000)], -500);

        Assert.False(plan.Avalanche.Feasible);
        Assert.InRange(plan.Avalanche.Months, 1, DebtPlanner.MaxMonths);
        Assert.Equal(0, plan.ExtraCents);
        Assert.Equal(0, plan.InterestSavedWithAvalancheCents);
        Assert.Equal(0, DebtPlanner.Plan([], 0).Avalanche.Months);
        var slow = DebtPlanner.Plan([Debt("Lento", 10_000_000, 0.01m, 1000)], 0);
        Assert.False(slow.Avalanche.Feasible);
        Assert.Equal(DebtPlanner.MaxMonths, slow.Avalanche.Months);
    }

    [Fact]
    public async Task Debts_are_saved_listed_planned_and_removed_by_their_owner()
    {
        var save = new SaveDebtHandler(new DebtRepository(_db));
        var created = await save.Handle(new SaveDebtCommand(_me.Id, null, " Cartão ", 300000, 10m, 20000));
        var updated = await save.Handle(new SaveDebtCommand(_me.Id, created!.Id, "Cartão Nubank", 250000, 9.5m, 25000));

        Assert.Equal(("Cartão Nubank", 250000L, 9.5m), (updated!.Name, updated.BalanceCents, updated.MonthlyRatePercent));
        await Assert.ThrowsAsync<NotFoundException>(() => save.Handle(new SaveDebtCommand(Guid.NewGuid(), created.Id, "x", 1, 1, 1)));
        await Assert.ThrowsAsync<NotFoundException>(() => save.Handle(new SaveDebtCommand(_me.Id, Guid.NewGuid(), "x", 1, 1, 1)));
        Assert.Single(await new GetDebtsHandler(new DebtRepository(_db)).Handle(new GetDebtsQuery(_me.Id)));
        Assert.True((await new GetDebtPlanHandler(new DebtRepository(_db)).Handle(new GetDebtPlanQuery(_me.Id, 0))).Avalanche.Feasible);

        var delete = new DeleteDebtHandler(new DebtRepository(_db));
        await Assert.ThrowsAsync<NotFoundException>(() => delete.Handle(new DeleteDebtCommand(Guid.NewGuid(), created.Id)));
        await delete.Handle(new DeleteDebtCommand(_me.Id, created.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => delete.Handle(new DeleteDebtCommand(_me.Id, created.Id)));
        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Dívida cadastrada: Cartão"));
        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Dívida atualizada: Cartão Nubank"));
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Dívida removida: Cartão Nubank");
    }

    [Theory]
    [InlineData(" ", 100, 1, 10)]
    [InlineData("x", -1, 1, 10)]
    [InlineData("x", 100, -1, 10)]
    [InlineData("x", 100, 51, 10)]
    [InlineData("x", 100, 1, 0)]
    public async Task Invalid_debts_are_rejected(string name, long balance, double rate, long minimum)
    {
        var save = new SaveDebtHandler(new DebtRepository(_db));

        await Assert.ThrowsAsync<BusinessRuleException>(() => save.Handle(new SaveDebtCommand(_me.Id, null, name, balance, (decimal)rate, minimum)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => save.Handle(new SaveDebtCommand(_me.Id, null, new string('n', 101), 1, 1, 1)));
    }
}

public class PlanningAnalysisTests
{
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _account;
    private readonly Category _moradia;
    private readonly Category _lazer;
    private readonly Category _salario;

    public PlanningAnalysisTests()
    {
        _me = _db.AddUser();
        _account = _db.AddAccount(_me.Id);
        _moradia = _db.AddCategory(_me.Id, "Moradia");
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
    }

    private static DateTime Day(int year, int month, int day) => new(year, month, day, 12, 0, 0, DateTimeKind.Utc);

    private GetEmergencyFundHandler Emergency => new(
        new TransactionRepository(_db), new CategoryRepository(_db), new CategoryBudgetRepository(_db),
        new SavingsPlanRepository(_db), new GoalRepository(_db), TestRules.Provider);

    [Fact]
    public async Task The_emergency_fund_covers_months_of_essential_spending_and_tracks_the_chosen_goal()
    {
        foreach (var month in new[] { 7, 8, 9 })
        {
            _db.AddTransaction(_account, _moradia, 150000, Day(2026, month, 5), "Aluguel");
            _db.AddTransaction(_account, _lazer, 30000, Day(2026, month, 6), "Ifd*Pizzaria");
            _db.AddTransaction(_account, _salario, 400000, Day(2026, month, 1), "Empresa");
        }
        var goal = new Goal { UserId = _me.Id, Name = "Reserva", TargetCents = 1, CurrentCents = 300000 };
        _db.Goals.Add(goal);
        _db.SaveChanges();
        var set = new SetEmergencyFundHandler(new SavingsPlanRepository(_db), new GoalRepository(_db));

        var defaults = await Emergency.Handle(new GetEmergencyFundQuery(_me.Id, MonthStart, Now));
        Assert.Equal((6, 150000L, 900000L, (Guid?)null, 0L), (defaults.Months, defaults.MonthlyEssentialCents, defaults.TargetCents, defaults.GoalId, defaults.SavedCents));

        Assert.True(await set.Handle(new SetEmergencyFundCommand(_me.Id, 3, goal.Id)));
        Assert.True(await set.Handle(new SetEmergencyFundCommand(_me.Id, 4, goal.Id)));
        var tracked = await Emergency.Handle(new GetEmergencyFundQuery(_me.Id, MonthStart, Now));

        Assert.Equal((4, 600000L, "Reserva", 300000L, 50.0), (tracked.Months, tracked.TargetCents, tracked.GoalName, tracked.SavedCents, tracked.Percent));
        Assert.Equal(220000, tracked.AverageSavedCents);
        Assert.Equal(2, tracked.MonthsToReach);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Reserva de emergência definida: 4 meses de gastos essenciais");
    }

    [Fact]
    public async Task Emergency_settings_are_validated()
    {
        var set = new SetEmergencyFundHandler(new SavingsPlanRepository(_db), new GoalRepository(_db));

        await Assert.ThrowsAsync<BusinessRuleException>(() => set.Handle(new SetEmergencyFundCommand(_me.Id, 0, null)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => set.Handle(new SetEmergencyFundCommand(_me.Id, 25, null)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => set.Handle(new SetEmergencyFundCommand(_me.Id, 6, Guid.NewGuid())));
        Assert.True(await set.Handle(new SetEmergencyFundCommand(_me.Id, 6, null)));
    }

    [Fact]
    public void Without_history_or_savings_the_fund_has_no_forecast()
    {
        var empty = PlanningAnalyzer.EmergencyFund([], MonthStart, TestRules.Default, 6, null, 0);
        var full = PlanningAnalyzer.EmergencyFund([], MonthStart, TestRules.Default, 6, new Goal { CurrentCents = 10 }, 0);
        var stuck = PlanningAnalyzer.EmergencyFund(
            [new Transaction { Type = TransactionType.EXPENSE, AmountCents = 1000, Date = MonthStart.AddDays(-3), Description = "Aluguel" }],
            MonthStart, TestRules.Default, 6, null, 0);

        Assert.Equal((0L, 0.0, (int?)0), (empty.TargetCents, empty.Percent, empty.MonthsToReach));
        Assert.Equal(0, full.MonthsToReach);
        Assert.Null(stuck.MonthsToReach);
    }

    [Fact]
    public async Task Yearly_bills_are_expected_again_a_year_later_with_a_monthly_reserve()
    {
        _db.AddTransaction(_account, _moradia, 240000, Day(2026, 1, 20), "IPVA 2026 SP");
        _db.AddTransaction(_account, _moradia, 120000, Day(2025, 11, 10), "IPTU parcela única");
        _db.AddTransaction(_account, _moradia, 60000, Day(2025, 10, 5), "IPTU antigo demais");
        var insurance = _db.AddTransaction(_account, _moradia, 360000, Day(2026, 3, 1), "Porto Seguro");
        insurance.Recurrence = Recurrence.YEARLY;
        _db.AddTransaction(_account, _moradia, 50000, Day(2025, 10, 1), "Matricula escola");
        _db.SaveChanges();

        var result = await new GetSeasonalExpensesHandler(new TransactionRepository(_db), TestRules.Provider)
            .Handle(new GetSeasonalExpensesQuery(_me.Id, MonthStart, Now));

        Assert.Equal(["IPTU", "IPVA e licenciamento", "Porto Seguro"], result.Items.Select(i => i.Label));
        var iptu = result.Items[0];
        Assert.Equal((Day(2026, 11, 10), 1, 120000L), (iptu.NextDate, iptu.MonthsLeft, iptu.MonthlyReserveCents));
        var ipva = result.Items[1];
        Assert.Equal((3, 80000L), (ipva.MonthsLeft, ipva.MonthlyReserveCents));
        Assert.Equal(result.Items.Sum(i => i.MonthlyReserveCents), result.MonthlyReserveCents);
    }

    [Fact]
    public async Task Net_worth_is_accounts_minus_debts_with_the_balance_rebuilt_month_by_month()
    {
        _account.AddBalance(100000);
        var savings = _db.AddAccount(_me.Id, "Poupança");
        savings.AddBalance(50000);
        _db.Debts.Add(new Debt { UserId = _me.Id, Name = "Cartão", BalanceCents = 30000, MonthlyRatePercent = 10, MinimumPaymentCents = 1000 });
        _db.SaveChanges();
        _db.AddTransaction(_account, _salario, 40000, Day(2026, 10, 5), "Empresa");
        _db.AddTransaction(_account, _lazer, 10000, Day(2026, 9, 10), "Cinema");

        var result = await new GetNetWorthHandler(new AccountRepository(_db), new DebtRepository(_db), new TransactionRepository(_db))
            .Handle(new GetNetWorthQuery(_me.Id, MonthStart, Now));

        Assert.Equal((150000L, 30000L, 120000L), (result.AssetsCents, result.DebtsCents, result.NetCents));
        Assert.Equal(["Nubank", "Poupança"], result.Accounts.Select(a => a.Name));
        Assert.Equal(12, result.History.Count);
        Assert.Equal(150000, result.History[^1].AssetsCents);
        Assert.Equal(110000, result.History[^2].AssetsCents);
        Assert.Equal(120000, result.History[^3].AssetsCents);
    }
}

public class PlanningApiTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime Start = new(2025, 9, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime End = new(2025, 9, 30, 23, 0, 0, DateTimeKind.Utc);
    private readonly FakeMediator _mediator = new();

    [Fact]
    public async Task Wishlist_endpoints_send_the_user_and_map_missing_items_to_404()
    {
        var controller = new WishlistController(_mediator).SignedIn(Me);
        var item = new WishlistItemDto { Id = Guid.NewGuid() };
        _mediator.Returns<GetWishlistQuery>(_ => new WishlistDto());
        _mediator.Returns<CreateWishCommand>(_ => item);
        _mediator.Returns<DecideWishCommand>(c => c.WishId == item.Id ? item : throw new NotFoundException("não encontrado"));
        _mediator.Returns<DeleteWishCommand>(c => c.WishId == item.Id ? true : throw new NotFoundException("não encontrado"));

        Assert.IsType<OkObjectResult>((await controller.Get()).Result);
        Assert.Equal($"/api/wishlist/{item.Id}", Assert.IsType<CreatedResult>((await controller.Create(new CreateWishRequest { Name = "x", PriceCents = 1 })).Result).Location);
        Assert.IsType<OkObjectResult>((await controller.Decide(item.Id, new WishDecisionRequest { Status = WishStatus.GAVE_UP })).Result);
        await Assert.ThrowsAsync<NotFoundException>(() => controller.Decide(Guid.NewGuid(), new WishDecisionRequest()));
        Assert.IsType<NoContentResult>(await controller.Delete(item.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => controller.Delete(Guid.NewGuid()));
        Assert.All(_mediator.Sent, s => Assert.Equal(Me, s.GetType().GetProperty("UserId")!.GetValue(s)));
    }

    [Fact]
    public async Task Debt_endpoints_cover_list_plan_create_update_and_delete()
    {
        var controller = new DebtsController(_mediator).SignedIn(Me);
        var debt = new DebtDto { Id = Guid.NewGuid() };
        _mediator.Returns<GetDebtsQuery>(_ => new List<DebtDto> { debt });
        _mediator.Returns<GetDebtPlanQuery>(_ => new DebtPlanDto());
        _mediator.Returns<SaveDebtCommand>(c => c.DebtId == Guid.Empty ? throw new NotFoundException("não encontrado") : debt);
        _mediator.Returns<DeleteDebtCommand>(c => c.DebtId == debt.Id ? true : throw new NotFoundException("não encontrado"));
        var request = new SaveDebtRequest { Name = "Cartão", BalanceCents = 1, MonthlyRatePercent = 2, MinimumPaymentCents = 3 };

        Assert.IsType<OkObjectResult>((await controller.GetAll()).Result);
        Assert.IsType<OkObjectResult>((await controller.Plan(5000)).Result);
        await controller.Plan(null);
        Assert.IsType<CreatedResult>((await controller.Create(request)).Result);
        Assert.IsType<OkObjectResult>((await controller.Update(debt.Id, request)).Result);
        await Assert.ThrowsAsync<NotFoundException>(() => controller.Update(Guid.Empty, request));
        Assert.IsType<NoContentResult>(await controller.Delete(debt.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => controller.Delete(Guid.NewGuid()));
        Assert.Equal([5000L, 0L], _mediator.Sent.OfType<GetDebtPlanQuery>().Select(q => q.ExtraCents));
    }

    [Fact]
    public async Task Planning_endpoints_use_the_requested_month()
    {
        var controller = new PlanningController(_mediator).SignedIn(Me);
        _mediator.Returns<GetEmergencyFundQuery>(_ => new EmergencyFundDto());
        _mediator.Returns<GetSeasonalExpensesQuery>(_ => new SeasonalExpensesDto());
        _mediator.Returns<GetNetWorthQuery>(_ => new NetWorthDto());
        var goal = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetEmergency(Start, End)).Result);
        Assert.IsType<NoContentResult>(await controller.SetEmergency(new EmergencyFundRequest { Months = 6, GoalId = goal }));
        Assert.IsType<OkObjectResult>((await controller.GetSeasonal(Start, End)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetNetWorth(Start, End)).Result);

        Assert.Equal(new GetEmergencyFundQuery(Me, Start, End), _mediator.Sent[0]);
        Assert.Equal(new SetEmergencyFundCommand(Me, 6, goal), _mediator.Sent[1]);
        Assert.Equal(new GetSeasonalExpensesQuery(Me, Start, End), _mediator.Sent[2]);
        Assert.Equal(new GetNetWorthQuery(Me, Start, End), _mediator.Sent[3]);
    }
}

using System.Net;
using System.Security.Claims;
using System.Text;
using FinanceManager.Api.Authorization;
using FinanceManager.Api.Caching;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;
using FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Aplication.UseCases.Rules.Queries.TestRule;
using FinanceManager.Aplication.UseCases.Summary.Commands.DismissInsight;
using FinanceManager.Aplication.UseCases.Summary.Commands.SetSubscriptionChoice;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetDigest;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Auth;
using FinanceManager.Infrastructure.Classification;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Rates;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceManager.Tests.UseCases.Rules;

public class RulesHandlersTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly CountingProvider _provider = new();
    private readonly User _me;

    public RulesHandlersTests()
    {
        _me = _db.AddUser();
    }

    private readonly FinanceManager.Infrastructure.Messaging.UnitOfWork _work = new();
    private readonly CountingVersions _versions = new();

    private SaveRuleHandler Save => new(new ClassificationRuleRepository(_db), new ActivityLogRepository(_db), _provider, _work, _versions);
    private SetRuleActiveHandler Toggle => new(new ClassificationRuleRepository(_db), new ActivityLogRepository(_db), _provider, _work, _versions);

    private SaveRuleCommand Command(Guid? id = null, RuleType type = RuleType.SUPERFLUOUS, string pattern = @"\bbar\b", string? value = null, string? note = " Bares ") =>
        new(_me.Id, id, type, pattern, value, 5, note);

    [Fact]
    public async Task A_new_rule_is_saved_logged_and_refreshes_the_rules()
    {
        var dto = await Save.Handle(Command(pattern: "  \\bbar\\b  "));

        var saved = Assert.Single(_db.ClassificationRules.Where(r => r.Id == dto!.Id));
        Assert.Equal((@"\bbar\b", "Bares", 5, true), (saved.Pattern, saved.Note, saved.Priority, saved.IsActive));
        Assert.False(dto!.IsDefault);
        Assert.Equal((0, 0), (_provider.Invalidations, _versions.All));
        await _work.FlushAsync();
        Assert.Equal((1, 1), (_provider.Invalidations, _versions.All));
        Assert.Contains(_db.ActivityLogs, a => a.Source == "Regras" && a.Description == @"Regra criada: SUPERFLUOUS ""\bbar\b""" && a.UserId == _me.Id);
    }

    [Fact]
    public async Task Existing_rules_are_updated_and_unknown_ones_return_null()
    {
        var created = await Save.Handle(Command());

        var updated = await Save.Handle(Command(created!.Id, RuleType.BRAND, "toru", " Toru ", note: " "));

        Assert.Equal((RuleType.BRAND, "Toru", (string?)null), (updated!.Type, updated.Value, updated.Note));
        Assert.Contains(_db.ActivityLogs, a => a.Description == @"Regra alterada: BRAND ""toru""");
        Assert.Null(await Save.Handle(Command(Guid.NewGuid())));
    }

    public static TheoryData<RuleType, string, string?, string?> Invalid => new()
    {
        { (RuleType)99, "x", null, null },
        { RuleType.SUPERFLUOUS, " ", null, null },
        { RuleType.SUPERFLUOUS, new string('a', RuleCatalog.MaxPatternLength + 1), null, null },
        { RuleType.SUPERFLUOUS, "(", null, null },
        { RuleType.BRAND, "toru", " ", null },
        { RuleType.BRAND, "toru", new string('v', RuleCatalog.MaxValueLength + 1), null },
        { RuleType.SUPERFLUOUS, "x", null, new string('n', RuleCatalog.MaxNoteLength + 1) },
    };

    [Theory]
    [MemberData(nameof(Invalid))]
    public async Task Invalid_rules_are_rejected(RuleType type, string pattern, string? value, string? note)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() => Save.Handle(Command(type: type, pattern: pattern, value: value, note: note)));
        await _work.FlushAsync();
        Assert.Equal(0, _provider.Invalidations);
    }

    [Fact]
    public async Task Rules_can_be_switched_off_and_on_and_only_real_changes_are_logged()
    {
        var created = await Save.Handle(Command());

        var off = await Toggle.Handle(new SetRuleActiveCommand(_me.Id, created!.Id, false));
        var again = await Toggle.Handle(new SetRuleActiveCommand(_me.Id, created.Id, false));
        var on = await Toggle.Handle(new SetRuleActiveCommand(_me.Id, created.Id, true));

        Assert.False(off!.IsActive);
        Assert.False(again!.IsActive);
        Assert.True(on!.IsActive);
        await _work.FlushAsync();
        Assert.Equal((3, 3), (_provider.Invalidations, _versions.All));
        Assert.Single(_db.ActivityLogs, a => a.Description.StartsWith("Regra desativada"));
        Assert.Single(_db.ActivityLogs, a => a.Description.StartsWith("Regra ativada"));
        Assert.Null(await Toggle.Handle(new SetRuleActiveCommand(_me.Id, Guid.NewGuid(), true)));
    }

    [Fact]
    public async Task All_rules_are_listed_and_defaults_are_marked()
    {
        _db.ClassificationRules.AddRange(DefaultClassificationRules.All.Take(3));
        _db.SaveChanges();
        await Save.Handle(Command());

        var rules = await new GetRulesHandler(new ClassificationRuleRepository(_db)).Handle(new GetRulesQuery());

        Assert.Equal(4, rules.Count);
        Assert.Equal(3, rules.Count(r => r.IsDefault));
    }

    [Fact]
    public void Long_log_texts_are_truncated()
    {
        Assert.Equal(500, SaveRuleHandler.Truncate(new string('x', 600)).Length);
        Assert.Equal("curto", SaveRuleHandler.Truncate("curto"));
    }

    [Fact]
    public async Task Testing_a_pattern_shows_which_of_the_users_descriptions_it_would_catch()
    {
        var account = _db.AddAccount(_me.Id);
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        var bar = new Merchant { UserId = _me.Id, Name = "Bar do Zé", Key = "bardoze", Activity = "Bares e outros estabelecimentos" };
        _db.Merchants.Add(bar);
        _db.SaveChanges();
        _db.AddTransaction(account, lazer, 1000, Now.AddDays(-1), "Compra", bar);
        _db.AddTransaction(account, lazer, 1000, Now.AddDays(-2), "Compra", bar);
        _db.AddTransaction(account, lazer, 1000, Now.AddDays(-3), "Cinema Center");
        _db.AddTransaction(account, lazer, 1000, Now.AddMonths(-13), "Bar antigo");
        var handler = new TestRuleHandler(new TransactionRepository(_db));

        var result = await handler.Handle(new TestRuleQuery(_me.Id, @"\bbares\b", Now));
        var invalid = await handler.Handle(new TestRuleQuery(_me.Id, "(", Now));

        Assert.True(result.Valid);
        Assert.Equal(1, result.MatchCount);
        Assert.Equal(2, result.CheckedCount);
        Assert.Equal("Bar do Zé Bares e outros estabelecimentos Compra", Assert.Single(result.Samples));
        Assert.False(invalid.Valid);
        Assert.StartsWith("Padrão inválido", invalid.Error);
    }

    [Fact]
    public async Task A_pattern_that_takes_too_long_is_reported()
    {
        var account = _db.AddAccount(_me.Id);
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        _db.AddTransaction(account, lazer, 1000, Now.AddDays(-1), new string('a', 40) + "1");

        var result = await new TestRuleHandler(new TransactionRepository(_db)).Handle(new TestRuleQuery(_me.Id, "^(a+)+$", Now));

        Assert.False(result.Valid);
        Assert.Contains("demorou demais", result.Error);
    }

    private sealed class CountingVersions : FinanceManager.Aplication.Caching.IUserDataVersions
    {
        public int All { get; private set; }
        public List<Guid> Users { get; } = [];
        public void Bump(Guid userId) => Users.Add(userId);
        public void BumpAll() => All++;
    }

    private sealed class CountingProvider : IClassificationRulesProvider
    {
        public int Invalidations { get; private set; }
        public Task<ClassificationRules> GetAsync(CancellationToken cancellationToken = default) => Task.FromResult(TestRules.Default);
        public void Invalidate() => Invalidations++;
    }
}

public class InsightHandlersTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;

    public InsightHandlersTests()
    {
        _me = _db.AddUser();
    }

    [Fact]
    public async Task Alerts_are_dismissed_once_and_unknown_keys_are_rejected()
    {
        var handler = new DismissInsightHandler(new InsightDismissalRepository(_db));

        Assert.True(await handler.Handle(new DismissInsightCommand(_me.Id, " DUPLICATE:abc ")));
        Assert.False(await handler.Handle(new DismissInsightCommand(_me.Id, "DUPLICATE:abc")));
        Assert.True(await handler.Handle(new DismissInsightCommand(_me.Id, "BILL_INCREASE:claro:2026-10")));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new DismissInsightCommand(_me.Id, "OUTRA:1")));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new DismissInsightCommand(_me.Id, "")));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new DismissInsightCommand(_me.Id, "DUPLICATE:" + new string('x', 200))));

        Assert.Equal(["BILL_INCREASE:claro:2026-10", "DUPLICATE:abc"], (await new InsightDismissalRepository(_db).GetKeysAsync(_me.Id)).Order());
    }

    [Fact]
    public async Task Subscription_choices_are_created_changed_and_removed_with_history()
    {
        var handler = new SetSubscriptionChoiceHandler(new SubscriptionDecisionRepository(_db));

        Assert.True(await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "netflix", " Netflix ", SubscriptionChoice.KEEP, Now)));
        Assert.False(await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "netflix", "Netflix", SubscriptionChoice.KEEP, Now)));
        Assert.True(await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "netflix", "Netflix", SubscriptionChoice.CANCEL, Now.AddDays(1))));

        var decision = _db.SubscriptionDecisions.Single();
        Assert.Equal((SubscriptionChoice.CANCEL, Now.AddDays(1), "Netflix"), (decision.Choice, decision.DecidedAt, decision.Name));

        Assert.True(await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "netflix", "", null, Now)));
        Assert.False(await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "netflix", "", null, Now)));
        Assert.Empty(_db.SubscriptionDecisions);
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Assinatura Netflix marcada como mantida");
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Assinatura Netflix marcada como cancelada");
        Assert.Contains(_db.ActivityLogs, a => a.Description == "Decisão sobre a assinatura Netflix desfeita");
    }

    [Fact]
    public async Task Subscription_choices_validate_the_input_and_trim_long_names()
    {
        var handler = new SetSubscriptionChoiceHandler(new SubscriptionDecisionRepository(_db));

        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, " ", "x", SubscriptionChoice.KEEP, Now)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, new string('k', 201), "x", SubscriptionChoice.KEEP, Now)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "k", "x", (SubscriptionChoice)9, Now)));
        await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "spotify", new string('n', 300), SubscriptionChoice.CANCEL, Now));
        await handler.Handle(new SetSubscriptionChoiceCommand(_me.Id, "deezer", " ", SubscriptionChoice.CANCEL, Now));

        Assert.Equal(200, _db.SubscriptionDecisions.Single(d => d.MerchantKey == "spotify").Name.Length);
        Assert.Equal("deezer", _db.SubscriptionDecisions.Single(d => d.MerchantKey == "deezer").Name);
    }

    [Fact]
    public async Task The_digest_handler_loads_enough_history_and_the_goals()
    {
        var account = _db.AddAccount(_me.Id);
        var lazer = _db.AddCategory(_me.Id, "Lazer");
        _db.AddTransaction(account, lazer, 4000, new DateTime(2026, 10, 2, 12, 0, 0, DateTimeKind.Utc), "Cinema");
        _db.AddTransaction(account, lazer, 3000, new DateTime(2026, 9, 2, 12, 0, 0, DateTimeKind.Utc), "Cinema");
        _db.Goals.Add(new Goal { UserId = _me.Id, Name = "Viagem", TargetCents = 1000, CurrentCents = 500 });
        _db.SaveChanges();
        var monthStart = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        var digest = await new GetDigestHandler(new TransactionRepository(_db), new GoalRepository(_db), TestRules.Provider)
            .Handle(new GetDigestQuery(_me.Id, monthStart, new DateTime(2026, 10, 3, 12, 0, 0, DateTimeKind.Utc), new DateTime(2026, 10, 3, 0, 0, 0, DateTimeKind.Utc)));

        Assert.Equal(4000, digest.Month.SpentCents);
        Assert.Equal(3000, digest.Month.PreviousSpentCents);
        Assert.Equal(4000, digest.Week.SpentCents);
        Assert.Equal(50, Assert.Single(digest.Goals).Percent);
    }
}

public class AdminAndRulesApiTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private readonly FakeMediator _mediator = new();

    private static IConfiguration Config(string? emails) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["Admin:Emails"] = emails }).Build();

    [Fact]
    public void Admins_come_from_the_configured_emails()
    {
        var admins = new ConfigAdminDirectory(Config(" ana@x.com, Bia@X.com ;"));

        Assert.True(admins.IsAdmin("ANA@x.com"));
        Assert.True(admins.IsAdmin(" bia@x.com "));
        Assert.False(admins.IsAdmin("caio@x.com"));
        Assert.False(admins.IsAdmin(null));
        Assert.False(admins.IsAdmin(" "));
        Assert.False(new ConfigAdminDirectory(Config(null)).IsAdmin("ana@x.com"));
    }

    [Theory]
    [InlineData("ana@x.com", true)]
    [InlineData("caio@x.com", false)]
    [InlineData(null, false)]
    public async Task The_admin_requirement_checks_the_email_claim(string? email, bool allowed)
    {
        var claims = email == null ? [] : new[] { new Claim(ClaimTypes.Email, email) };
        var requirement = new AdminRequirement();
        var context = new AuthorizationHandlerContext([requirement], new ClaimsPrincipal(new ClaimsIdentity(claims, "test")), null);

        await new AdminRequirementHandler(new ConfigAdminDirectory(Config("ana@x.com"))).HandleAsync(context);

        Assert.Equal(allowed, context.HasSucceeded);
    }

    private RulesController Rules => new RulesController(_mediator).SignedIn(Me);

    [Fact]
    public async Task Rule_endpoints_forward_to_the_use_cases()
    {
        var dto = new RuleDto { Id = Guid.NewGuid() };
        var request = new SaveRuleRequest { Type = RuleType.BRAND, Pattern = "toru", Value = "Toru", Priority = 3, Note = "n" };
        _mediator.Returns<SaveRuleCommand>(c => c.RuleId == Guid.Empty ? null : dto);
        _mediator.Returns<SetRuleActiveCommand>(c => c.RuleId == dto.Id ? dto : null);
        _mediator.Returns<GetRulesQuery>(_ => new List<RuleDto> { dto });
        _mediator.Returns<TestRuleQuery>(_ => new RuleTestDto { Valid = true });

        var created = Assert.IsType<CreatedResult>((await Rules.Create(request)).Result);
        var updated = await Rules.Update(dto.Id, request);
        var missing = await Rules.Update(Guid.Empty, request);
        var toggled = await Rules.SetActive(dto.Id, new RuleActiveRequest { IsActive = false });
        var toggleMissing = await Rules.SetActive(Guid.NewGuid(), new RuleActiveRequest { IsActive = true });
        var list = await Rules.GetAll();
        var test = await Rules.Test(new RuleTestRequest { Pattern = "x" });

        Assert.Equal($"/api/rules/{dto.Id}", created.Location);
        Assert.Same(dto, Assert.IsType<OkObjectResult>(updated.Result).Value);
        Assert.IsType<NotFoundResult>(missing.Result);
        Assert.Same(dto, Assert.IsType<OkObjectResult>(toggled.Result).Value);
        Assert.IsType<NotFoundResult>(toggleMissing.Result);
        Assert.IsType<OkObjectResult>(list.Result);
        Assert.True(Assert.IsType<RuleTestDto>(Assert.IsType<OkObjectResult>(test.Result).Value).Valid);
        var sent = _mediator.Sent.OfType<SaveRuleCommand>().First();
        Assert.Equal((Me, (Guid?)null, RuleType.BRAND, "toru", "Toru", 3, "n"), (sent.UserId, sent.RuleId, sent.Type, sent.Pattern, sent.Value, sent.Priority, sent.Note));
    }

    [Fact]
    public async Task Summary_endpoints_for_alerts_digest_and_subscriptions()
    {
        var summary = new SummaryController(_mediator).SignedIn(Me);
        var digest = new DigestDto();
        _mediator.Returns<GetDigestQuery>(_ => digest);
        var start = new DateTime(2025, 9, 1, 3, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2025, 9, 30, 23, 0, 0, DateTimeKind.Utc);
        var dayStart = new DateTime(2025, 9, 20, 3, 0, 0, DateTimeKind.Utc);

        var result = await summary.GetDigest(start, end, dayStart);
        await summary.GetDigest(start, end, null);
        await summary.GetDigest(start, end, end.AddDays(3));
        Assert.IsType<NoContentResult>(await summary.Dismiss(new DismissInsightRequest { Key = "DUPLICATE:1" }));
        Assert.IsType<NoContentResult>(await summary.SetSubscriptionChoice(new SubscriptionChoiceRequest { Key = "netflix", Name = "Netflix", Choice = SubscriptionChoice.CANCEL }));

        Assert.Same(digest, Assert.IsType<OkObjectResult>(result.Result).Value);
        var digests = _mediator.Sent.OfType<GetDigestQuery>().ToList();
        Assert.Equal(new GetDigestQuery(Me, start, end, dayStart), digests[0]);
        Assert.Equal(new DateTime(2025, 9, 30, 3, 0, 0, DateTimeKind.Utc), digests[1].DayStart);
        Assert.Equal(end, digests[2].DayStart);
        Assert.Equal(new DismissInsightCommand(Me, "DUPLICATE:1"), _mediator.Sent.OfType<DismissInsightCommand>().Single());
        var choice = _mediator.Sent.OfType<SetSubscriptionChoiceCommand>().Single();
        Assert.Equal((Me, "netflix", "Netflix", (SubscriptionChoice?)SubscriptionChoice.CANCEL), (choice.UserId, choice.Key, choice.Name, choice.Choice));
    }

    [Fact]
    public async Task The_rules_provider_reloads_after_being_invalidated()
    {
        var services = new ServiceCollection();
        var db = TestDb.InMemory();
        services.AddSingleton(db);
        services.AddScoped<FinanceManager.Domain.Interfaces.Repositories.IClassificationRuleRepository>(sp => new ClassificationRuleRepository(sp.GetRequiredService<AppDbContext>()));
        var provider = new ClassificationRulesProvider(new MemoryCache(new MemoryCacheOptions()), services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(), NullLogger<ClassificationRulesProvider>.Instance);

        Assert.False((await provider.GetAsync()).IsBill("Claro"));
        db.ClassificationRules.Add(new ClassificationRule { Type = RuleType.BILL, Pattern = "claro" });
        db.SaveChanges();
        Assert.False((await provider.GetAsync()).IsBill("Claro"));
        provider.Invalidate();
        Assert.True((await provider.GetAsync()).IsBill("Claro"));
    }

    [Fact]
    public async Task Inflation_comes_from_the_central_bank_with_its_own_fallback()
    {
        var handler = new StubHandler { Body = """[{"data":"01/09/2026","valor":"4.71"}]""" };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var rates = new BcbInterestRateProvider(new HttpClient(handler), cache, Config(null), NullLogger<BcbInterestRateProvider>.Instance);

        Assert.Equal(4.71m, await rates.GetInflation12MonthsPercentAsync());
        Assert.Equal(BcbInterestRateProvider.IpcaSeriesUrl, handler.Requests.Single().ToString());

        handler.Status = HttpStatusCode.InternalServerError;
        var fallback = new BcbInterestRateProvider(new HttpClient(handler), new MemoryCache(new MemoryCacheOptions()), Config(null), NullLogger<BcbInterestRateProvider>.Instance);
        Assert.Equal(4.5m, await fallback.GetInflation12MonthsPercentAsync());
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public HttpStatusCode Status { get; set; } = HttpStatusCode.OK;
        public string Body { get; set; } = "[]";
        public List<Uri> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request.RequestUri!);
            return Task.FromResult(new HttpResponseMessage(Status) { Content = new StringContent(Body, Encoding.UTF8, "application/json") });
        }
    }
}

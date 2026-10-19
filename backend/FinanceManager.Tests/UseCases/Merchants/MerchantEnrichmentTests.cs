using System.Net;
using System.Text;
using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.UseCases.Merchants.Commands.ApplyMerchantActivity;
using FinanceManager.Aplication.UseCases.Merchants.Commands.RecordEnrichmentFailure;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantsPendingEnrichment;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetCashFlowForecast;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Companies;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using IMediator = FinanceManager.Aplication.Mediator.Messaging.IMediator;

namespace FinanceManager.Tests.UseCases.Merchants;

public class MerchantEnrichmentTests
{
    private static readonly DateTime Now = new(2026, 10, 18, 12, 0, 0, DateTimeKind.Utc);
    private static readonly CompanyInfo Restaurant = new("5611201", "Restaurantes e similares");

    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _account;
    private readonly Category _outros;
    private readonly Category _lazer;
    private readonly Category _alimentacao;

    public MerchantEnrichmentTests()
    {
        _me = _db.AddUser();
        _account = _db.AddAccount(_me.Id);
        _outros = _db.AddCategory(_me.Id, "Outros");
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _alimentacao = _db.AddCategory(_me.Id, "Alimentação");
    }

    private Merchant AddMerchant(string name, string? document = "12.345.678/0001-90", MerchantKind kind = MerchantKind.BUSINESS, Guid? categoryId = null, DateTime? enrichedAt = null)
    {
        var merchant = new Merchant
        {
            UserId = _me.Id, Name = name, Key = name.ToLowerInvariant().Replace(" ", ""), Kind = kind,
            Document = document, CategoryId = categoryId, EnrichedAt = enrichedAt,
        };
        _db.Merchants.Add(merchant);
        _db.SaveChanges();
        return merchant;
    }

    private readonly FinanceManager.Infrastructure.Messaging.UnitOfWork _work = new();
    private readonly List<Guid> _bumped = [];

    private ApplyMerchantActivityHandler ApplyHandler => new(
        new MerchantRepository(_db), new CategoryRepository(_db), new TransactionRepository(_db), TestRules.Provider, _work, new RecordingVersions(_bumped));

    [Fact]
    public async Task Only_businesses_with_a_cnpj_that_were_never_looked_up_are_pending()
    {
        var pending = AddMerchant("Jl Comercio");
        AddMerchant("Fulano", "•••.123.456-••", MerchantKind.PERSON);
        AddMerchant("Sem Documento", null);
        AddMerchant("Ja Visto", enrichedAt: Now);

        var result = await new GetMerchantsPendingEnrichmentHandler(new MerchantRepository(_db)).Handle(new GetMerchantsPendingEnrichmentQuery(10));

        var only = Assert.Single(result);
        Assert.Equal(new PendingEnrichment(pending.Id, "12345678000190"), only);
    }

    [Fact]
    public async Task Documents_that_cannot_be_looked_up_are_pending_without_a_cnpj_so_they_get_marked()
    {
        var malformed = AddMerchant("Estranho", "12.345/0001");
        var alphanumeric = AddMerchant("Nova", "12.ABC.345/01DE-35");

        var result = await new GetMerchantsPendingEnrichmentHandler(new MerchantRepository(_db)).Handle(new GetMerchantsPendingEnrichmentQuery(10));

        Assert.Equal(
            new[] { new PendingEnrichment(malformed.Id, null), new PendingEnrichment(alphanumeric.Id, null) }.OrderBy(p => p.MerchantId),
            result.OrderBy(p => p.MerchantId));
    }

    [Fact]
    public async Task Failed_lookups_are_counted_and_given_up_after_the_limit_and_retried_last()
    {
        var failing = AddMerchant("Falha");
        var fresh = AddMerchant("Nova");
        var handler = new RecordEnrichmentFailureHandler(new MerchantRepository(_db));
        var now = new DateTime(2026, 10, 19, 12, 0, 0, DateTimeKind.Utc);

        Assert.False(await handler.Handle(new RecordEnrichmentFailureCommand(failing.Id, now)));
        var pending = await new MerchantRepository(_db).GetPendingEnrichmentAsync(10);
        Assert.Equal([fresh.Id, failing.Id], pending.Select(m => m.Id));
        Assert.False(await handler.Handle(new RecordEnrichmentFailureCommand(failing.Id, now)));
        Assert.True(await handler.Handle(new RecordEnrichmentFailureCommand(failing.Id, now)));
        Assert.False(await handler.Handle(new RecordEnrichmentFailureCommand(Guid.NewGuid(), now)));

        Assert.Equal((RecordEnrichmentFailureHandler.MaxAttempts, (DateTime?)now), (failing.EnrichmentAttempts, failing.EnrichedAt));
        Assert.Equal([fresh.Id], (await new MerchantRepository(_db).GetPendingEnrichmentAsync(10)).Select(m => m.Id));
    }

    [Fact]
    public async Task The_activity_files_the_merchant_and_moves_only_its_unsorted_spending()
    {
        var merchant = AddMerchant("Jl Comercio");
        var unsorted = _db.AddTransaction(_account, _outros, 5000, Now, "Jl Comercio", merchant);
        var chosen = _db.AddTransaction(_account, _lazer, 7000, Now, "Jl Comercio", merchant);

        var moved = await ApplyHandler.Handle(new ApplyMerchantActivityCommand(merchant.Id, Restaurant, Now));

        Assert.Equal(1, moved);
        var saved = _db.Merchants.Single(m => m.Id == merchant.Id);
        Assert.Equal("5611201", saved.ActivityCode);
        Assert.Equal("Restaurantes e similares", saved.Activity);
        Assert.Equal(Now, saved.EnrichedAt);
        Assert.Equal(_alimentacao.Id, saved.CategoryId);
        Assert.Equal(_alimentacao.Id, _db.Transactions.Single(t => t.Id == unsorted.Id).CategoryId);
        Assert.Equal(_lazer.Id, _db.Transactions.Single(t => t.Id == chosen.Id).CategoryId);
        Assert.Empty(_bumped);
        await _work.FlushAsync();
        Assert.Equal([_me.Id], _bumped);
    }

    [Fact]
    public async Task A_category_chosen_by_the_user_is_kept()
    {
        var merchant = AddMerchant("Jl Comercio", categoryId: _lazer.Id);
        _db.AddTransaction(_account, _outros, 5000, Now, "Jl Comercio", merchant);

        var moved = await ApplyHandler.Handle(new ApplyMerchantActivityCommand(merchant.Id, Restaurant, Now));

        Assert.Equal(0, moved);
        Assert.Equal(_lazer.Id, _db.Merchants.Single(m => m.Id == merchant.Id).CategoryId);
        Assert.Equal("Restaurantes e similares", _db.Merchants.Single(m => m.Id == merchant.Id).Activity);
    }

    [Fact]
    public async Task Unknown_companies_and_activities_without_a_matching_category_are_only_marked_as_looked_up()
    {
        var unknown = AddMerchant("Desconhecida");
        var odd = AddMerchant("Fabrica");

        Assert.Equal(0, await ApplyHandler.Handle(new ApplyMerchantActivityCommand(unknown.Id, null, Now)));
        Assert.Equal(0, await ApplyHandler.Handle(new ApplyMerchantActivityCommand(odd.Id, new CompanyInfo("2511000", "Fabricação de estruturas metálicas"), Now)));
        Assert.Equal(0, await ApplyHandler.Handle(new ApplyMerchantActivityCommand(Guid.NewGuid(), Restaurant, Now)));

        Assert.All(_db.Merchants, m => Assert.Equal(Now, m.EnrichedAt));
        Assert.Null(_db.Merchants.Single(m => m.Id == unknown.Id).Activity);
        Assert.Null(_db.Merchants.Single(m => m.Id == odd.Id).CategoryId);
    }

    [Fact]
    public async Task A_hint_for_a_category_the_user_does_not_have_changes_nothing()
    {
        var merchant = AddMerchant("Farmacia");

        await ApplyHandler.Handle(new ApplyMerchantActivityCommand(merchant.Id, new CompanyInfo("4771701", "Comércio varejista de produtos farmacêuticos"), Now));

        Assert.Null(_db.Merchants.Single().CategoryId);
    }

    [Fact]
    public async Task A_merchant_with_no_unsorted_spending_gets_the_category_without_moving_anything()
    {
        var merchant = AddMerchant("Jl Comercio");

        Assert.Equal(0, await ApplyHandler.Handle(new ApplyMerchantActivityCommand(merchant.Id, Restaurant, Now)));
        Assert.Equal(_alimentacao.Id, _db.Merchants.Single().CategoryId);
    }

    [Fact]
    public async Task The_forecast_handler_reads_the_history_the_forecast_needs()
    {
        var salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
        _db.AddTransaction(_account, salario, 500000, new DateTime(2026, 8, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa Acme");
        _db.AddTransaction(_account, salario, 500000, new DateTime(2026, 9, 5, 12, 0, 0, DateTimeKind.Utc), "Empresa Acme");
        var monthStart = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        var result = await new GetCashFlowForecastHandler(new TransactionRepository(_db), TestRules.Provider)
            .Handle(new GetCashFlowForecastQuery(_me.Id, monthStart, new DateTime(2026, 10, 2, 12, 0, 0, DateTimeKind.Utc), null));

        Assert.Equal(500000, result.PendingIncomeCents);
        Assert.Equal(5, result.NextIncome!.ExpectedDate.Day);
    }
}

public class BrasilApiCompanyRegistryTests
{
    private readonly StubHandler _handler = new();

    private BrasilApiCompanyRegistry Registry => new(new HttpClient(_handler));

    [Fact]
    public async Task Reads_the_main_economic_activity_of_the_company()
    {
        _handler.Body = """{"cnpj":"12345678000190","cnae_fiscal":5611201,"cnae_fiscal_descricao":"Restaurantes e similares"}""";

        var company = await Registry.LookupAsync("12345678000190");

        Assert.Equal(new CompanyInfo("5611201", "Restaurantes e similares"), company);
        Assert.Equal(BrasilApiCompanyRegistry.BaseUrl + "12345678000190", Assert.Single(_handler.Requests).ToString());
        Assert.Equal(BrasilApiCompanyRegistry.UserAgent, Assert.Single(_handler.UserAgents));
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound, "{}")]
    [InlineData(HttpStatusCode.BadRequest, "{}")]
    [InlineData(HttpStatusCode.OK, """{"cnae_fiscal":null}""")]
    [InlineData(HttpStatusCode.OK, """{"cnae_fiscal":5611201,"cnae_fiscal_descricao":" "}""")]
    [InlineData(HttpStatusCode.OK, "null")]
    public async Task Unknown_companies_have_no_activity(HttpStatusCode status, string body)
    {
        _handler.Status = status;
        _handler.Body = body;

        Assert.Null(await Registry.LookupAsync("12345678000190"));
    }

    [Fact]
    public async Task Service_failures_are_reported_so_the_lookup_is_retried_later()
    {
        _handler.Status = HttpStatusCode.TooManyRequests;

        await Assert.ThrowsAsync<HttpRequestException>(() => Registry.LookupAsync("12345678000190"));
    }

    internal sealed class StubHandler : HttpMessageHandler
    {
        public HttpStatusCode Status { get; set; } = HttpStatusCode.OK;
        public string Body { get; set; } = "{}";
        public List<Uri> Requests { get; } = [];
        public List<string> UserAgents { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request.RequestUri!);
            UserAgents.Add(request.Headers.UserAgent.ToString());
            return Task.FromResult(new HttpResponseMessage(Status) { Content = new StringContent(Body, Encoding.UTF8, "application/json") });
        }
    }
}

public class MerchantEnrichmentServiceTests
{
    private readonly FakeMediator _mediator = new();
    private readonly FakeRegistry _registry = new();
    private readonly ListLogger<MerchantEnrichmentService> _logger = new();

    private MerchantEnrichmentService Service(int idleSeconds = 0)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IMediator>(_mediator);
        services.AddSingleton<ICompanyRegistry>(_registry);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Enrichment:IntervalSeconds"] = "0",
            ["Enrichment:PauseMilliseconds"] = "0",
            ["Enrichment:IdleIntervalSeconds"] = idleSeconds.ToString(),
        }).Build();
        return new MerchantEnrichmentService(services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(), config, _logger);
    }

    [Fact]
    public async Task Each_pending_merchant_is_looked_up_and_its_activity_applied()
    {
        var first = new PendingEnrichment(Guid.NewGuid(), "11111111000111");
        var second = new PendingEnrichment(Guid.NewGuid(), "22222222000122");
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment> { first, second });
        _registry.Companies["11111111000111"] = new CompanyInfo("5611201", "Restaurantes e similares");

        var enriched = await Service().RunOnceAsync();

        Assert.Equal(2, enriched);
        Assert.Equal(new GetMerchantsPendingEnrichmentQuery(MerchantEnrichmentService.BatchSize), _mediator.Sent[0]);
        var applied = _mediator.Sent.OfType<ApplyMerchantActivityCommand>().ToList();
        Assert.Equal(first.MerchantId, applied[0].MerchantId);
        Assert.Equal("Restaurantes e similares", applied[0].Company!.Activity);
        Assert.Null(applied[1].Company);
        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Information);
    }

    [Fact]
    public async Task An_unavailable_registry_stops_the_batch_and_counts_a_failed_attempt()
    {
        var merchant = new PendingEnrichment(Guid.NewGuid(), "11111111000111");
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment> { merchant, new(Guid.NewGuid(), "22222222000122") });
        _registry.Fails = true;

        Assert.Equal(0, await Service().RunOnceAsync());
        Assert.Empty(_mediator.Sent.OfType<ApplyMerchantActivityCommand>());
        Assert.Equal(merchant.MerchantId, Assert.Single(_mediator.Sent.OfType<RecordEnrichmentFailureCommand>()).MerchantId);
        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Warning);
    }

    [Fact]
    public async Task A_registry_timeout_is_handled_like_an_outage()
    {
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment> { new(Guid.NewGuid(), "11111111000111") });
        _registry.TimesOut = true;

        Assert.Equal(0, await Service().RunOnceAsync());
        Assert.Single(_mediator.Sent.OfType<RecordEnrichmentFailureCommand>());
    }

    [Fact]
    public async Task Stopping_the_app_during_a_lookup_cancels_without_counting_a_failure()
    {
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment> { new(Guid.NewGuid(), "11111111000111") });
        _registry.TimesOut = true;
        using var stopping = new CancellationTokenSource();
        stopping.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Service().RunOnceAsync(stopping.Token));
        Assert.Empty(_mediator.Sent.OfType<RecordEnrichmentFailureCommand>());
    }

    [Fact]
    public async Task Merchants_without_a_lookup_cnpj_are_marked_without_calling_the_registry()
    {
        var merchant = new PendingEnrichment(Guid.NewGuid(), null);
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment> { merchant });

        Assert.Equal(0, await Service().RunOnceAsync());
        var applied = Assert.Single(_mediator.Sent.OfType<ApplyMerchantActivityCommand>());
        Assert.Equal((merchant.MerchantId, (CompanyInfo?)null), (applied.MerchantId, applied.Company));
        Assert.Empty(_registry.Calls);
    }

    [Fact]
    public async Task A_timeout_inside_the_loop_does_not_stop_the_background_service()
    {
        _mediator.Throws<GetMerchantsPendingEnrichmentQuery>(new TaskCanceledException("timeout"));
        var service = Service();

        await service.StartAsync(CancellationToken.None);
        for (var i = 0; i < 100 && _logger.Entries.Count < 2; i++) await Task.Delay(20);
        await service.StopAsync(CancellationToken.None);

        Assert.True(_logger.Entries.Count(e => e.Level == LogLevel.Warning) >= 2);
        Assert.False(service.ExecuteTask!.IsFaulted);
    }

    [Fact]
    public async Task The_background_loop_keeps_running_after_failures_and_stops_with_the_app()
    {
        _mediator.Throws<GetMerchantsPendingEnrichmentQuery>(new InvalidOperationException("db down"));
        var service = Service();

        await service.StartAsync(CancellationToken.None);
        for (var i = 0; i < 100 && _logger.Entries.Count < 2; i++) await Task.Delay(20);
        await service.StopAsync(CancellationToken.None);

        Assert.True(_logger.Entries.Count(e => e.Level == LogLevel.Warning) >= 2);
    }

    [Fact]
    public async Task With_nothing_pending_the_loop_waits_the_idle_interval()
    {
        _mediator.Returns<GetMerchantsPendingEnrichmentQuery>(_ => new List<PendingEnrichment>());
        var service = Service(idleSeconds: 3600);

        await service.StartAsync(CancellationToken.None);
        for (var i = 0; i < 50 && _mediator.Sent.Count == 0; i++) await Task.Delay(20);
        await Task.Delay(200);
        await service.StopAsync(CancellationToken.None);

        Assert.Single(_mediator.Sent);
    }

    private sealed class FakeRegistry : ICompanyRegistry
    {
        public Dictionary<string, CompanyInfo> Companies { get; } = [];
        public bool Fails { get; set; }
        public bool TimesOut { get; set; }
        public List<string> Calls { get; } = [];

        public Task<CompanyInfo?> LookupAsync(string cnpj, CancellationToken cancellationToken = default)
        {
            Calls.Add(cnpj);
            if (TimesOut) throw cancellationToken.IsCancellationRequested ? new TaskCanceledException("parado", null, cancellationToken) : new TaskCanceledException("timeout");
            return Fails ? throw new HttpRequestException("indisponível") : Task.FromResult(Companies.GetValueOrDefault(cnpj));
        }
    }
}

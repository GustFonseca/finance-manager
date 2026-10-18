using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants.Commands.ApplyMerchantActivity;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantsPendingEnrichment;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Companies;

public sealed class MerchantEnrichmentService : BackgroundService
{
    public const int BatchSize = 10;

    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<MerchantEnrichmentService> _logger;
    private readonly TimeSpan _interval;
    private readonly TimeSpan _idleInterval;
    private readonly TimeSpan _pause;

    public MerchantEnrichmentService(IServiceScopeFactory scopes, IConfiguration config, ILogger<MerchantEnrichmentService> logger)
    {
        _scopes = scopes;
        _logger = logger;
        _interval = TimeSpan.FromSeconds(config.GetValue("Enrichment:IntervalSeconds", 120));
        _idleInterval = TimeSpan.FromSeconds(config.GetValue("Enrichment:IdleIntervalSeconds", 3600));
        _pause = TimeSpan.FromMilliseconds(config.GetValue("Enrichment:PauseMilliseconds", 1500));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var idle = false;
            try
            {
                idle = (await RunBatchAsync(stoppingToken)).Pending == 0;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Merchant enrichment failed; will retry");
            }
            await Task.Delay(idle ? _idleInterval : _interval, stoppingToken);
        }
    }

    public async Task<int> RunOnceAsync(CancellationToken cancellationToken = default) =>
        (await RunBatchAsync(cancellationToken)).Enriched;

    private async Task<(int Pending, int Enriched)> RunBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopes.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        var registry = scope.ServiceProvider.GetRequiredService<ICompanyRegistry>();
        var pending = await mediator.Send(new GetMerchantsPendingEnrichmentQuery(BatchSize), cancellationToken);

        var enriched = 0;
        foreach (var merchant in pending)
        {
            CompanyInfo? company;
            try
            {
                company = await registry.LookupAsync(merchant.Cnpj, cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "Company registry unavailable; stopping this batch");
                break;
            }
            await mediator.Send(new ApplyMerchantActivityCommand(merchant.MerchantId, company, DateTime.UtcNow), cancellationToken);
            enriched++;
            await Task.Delay(_pause, cancellationToken);
        }
        if (enriched > 0) _logger.LogInformation("Enriched {Count} merchants with their economic activity", enriched);
        return (pending.Count, enriched);
    }
}

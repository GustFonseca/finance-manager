using System.Globalization;
using System.Net.Http.Json;
using FinanceManager.Aplication.Rates;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Rates;

public sealed class BcbInterestRateProvider : IInterestRateProvider
{
    public const string CdiSeriesUrl = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json";
    public static readonly TimeSpan RefreshEvery = TimeSpan.FromHours(12);
    public static readonly TimeSpan RetryAfterFailure = TimeSpan.FromHours(1);
    private const string CacheKey = "cdi-annual-percent";

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;
    private readonly ILogger<BcbInterestRateProvider> _logger;

    public BcbInterestRateProvider(HttpClient http, IMemoryCache cache, IConfiguration config, ILogger<BcbInterestRateProvider> logger)
    {
        _http = http;
        _cache = cache;
        _config = config;
        _logger = logger;
    }

    public async Task<decimal> GetCdiAnnualPercentAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(CacheKey, out decimal cached)) return cached;
        try
        {
            var points = await _http.GetFromJsonAsync<List<SeriesPoint>>(CdiSeriesUrl, cancellationToken);
            var rate = decimal.Parse(points![^1].Valor, CultureInfo.InvariantCulture);
            _cache.Set(CacheKey, rate, RefreshEvery);
            return rate;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or FormatException or NotSupportedException or System.Text.Json.JsonException or ArgumentOutOfRangeException or NullReferenceException)
        {
            var fallback = _config.GetValue("Analysis:CdiAnnualPercent", 14.9m);
            _logger.LogWarning(ex, "CDI rate unavailable, using {Fallback}%", fallback);
            _cache.Set(CacheKey, fallback, RetryAfterFailure);
            return fallback;
        }
    }

    private sealed record SeriesPoint(string Data, string Valor);
}

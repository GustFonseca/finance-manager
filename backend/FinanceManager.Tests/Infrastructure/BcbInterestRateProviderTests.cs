using System.Net;
using System.Text;
using FinanceManager.Infrastructure.Rates;
using FinanceManager.Tests.Support;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Tests.Infrastructure;

public class BcbInterestRateProviderTests
{
    private readonly StubHandler _handler = new();
    private readonly MemoryCache _cache = new(new MemoryCacheOptions());
    private readonly ListLogger<BcbInterestRateProvider> _logger = new();

    private BcbInterestRateProvider Provider(decimal? fallback = null)
    {
        var settings = new Dictionary<string, string?>();
        if (fallback.HasValue) settings["Analysis:CdiAnnualPercent"] = fallback.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return new BcbInterestRateProvider(
            new HttpClient(_handler), _cache, new ConfigurationBuilder().AddInMemoryCollection(settings).Build(), _logger);
    }

    [Fact]
    public async Task Reads_the_latest_cdi_from_the_central_bank_and_caches_it()
    {
        _handler.Body = """[{"data":"17/10/2026","valor":"14.90"}]""";

        Assert.Equal(14.90m, await Provider().GetCdiAnnualPercentAsync());
        _handler.Body = """[{"data":"18/10/2026","valor":"15.10"}]""";
        Assert.Equal(14.90m, await Provider().GetCdiAnnualPercentAsync());

        Assert.Equal(BcbInterestRateProvider.CdiSeriesUrl, Assert.Single(_handler.Requests).ToString());
    }

    [Theory]
    [InlineData(HttpStatusCode.ServiceUnavailable, "erro")]
    [InlineData(HttpStatusCode.OK, "[]")]
    [InlineData(HttpStatusCode.OK, """[{"data":"17/10/2026","valor":"n/d"}]""")]
    [InlineData(HttpStatusCode.OK, "não é json")]
    public async Task Falls_back_to_the_configured_rate_when_the_service_fails(HttpStatusCode status, string body)
    {
        _handler.Status = status;
        _handler.Body = body;

        Assert.Equal(13.25m, await Provider(13.25m).GetCdiAnnualPercentAsync());
        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Warning && e.Message.Contains("13.25"));
        _handler.Status = HttpStatusCode.OK;
        _handler.Body = """[{"data":"17/10/2026","valor":"14.90"}]""";
        Assert.Equal(13.25m, await Provider(13.25m).GetCdiAnnualPercentAsync());
        Assert.Single(_handler.Requests);
    }

    [Fact]
    public async Task Without_configuration_the_built_in_fallback_is_used()
    {
        _handler.Status = HttpStatusCode.InternalServerError;

        Assert.Equal(14.9m, await Provider().GetCdiAnnualPercentAsync());
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

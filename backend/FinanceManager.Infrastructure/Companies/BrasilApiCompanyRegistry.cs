using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using FinanceManager.Aplication.Companies;

namespace FinanceManager.Infrastructure.Companies;

public sealed class BrasilApiCompanyRegistry : ICompanyRegistry
{
    public const string BaseUrl = "https://brasilapi.com.br/api/cnpj/v1/";
    public const string UserAgent = "finance-manager/1.0";

    private readonly HttpClient _http;

    public BrasilApiCompanyRegistry(HttpClient http)
    {
        _http = http;
        _http.DefaultRequestHeaders.UserAgent.ParseAdd(UserAgent);
    }

    public async Task<CompanyInfo?> LookupAsync(string cnpj, CancellationToken cancellationToken = default)
    {
        using var response = await _http.GetAsync(BaseUrl + cnpj, cancellationToken);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest) return null;
        response.EnsureSuccessStatusCode();
        var company = await response.Content.ReadFromJsonAsync<Company>(cancellationToken);
        return company?.CnaeFiscal is { } code && !string.IsNullOrWhiteSpace(company.CnaeFiscalDescricao)
            ? new CompanyInfo(code.ToString(), company.CnaeFiscalDescricao)
            : null;
    }

    private sealed record Company(
        [property: JsonPropertyName("cnae_fiscal")] long? CnaeFiscal,
        [property: JsonPropertyName("cnae_fiscal_descricao")] string? CnaeFiscalDescricao);
}

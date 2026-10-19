using System.Net.Http.Headers;
using System.Net.Http.Json;
using FinanceManager.Aplication.Storage;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Infrastructure.Storage;

public class SupabaseFileStorage : IFileStorage
{
    private const int DownloadUrlSeconds = 120;

    private readonly HttpClient _http;
    private readonly string _bucket;

    public SupabaseFileStorage(HttpClient http, IConfiguration config)
    {
        var url = config["Supabase:Url"];
        var key = config["Supabase:SecretKey"];
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("Supabase:Url and Supabase:SecretKey must be configured to store files.");

        _bucket = config["Supabase:Bucket"] ?? "files";
        _http = http;
        _http.BaseAddress = new Uri($"{url.TrimEnd('/')}/storage/v1/");
        _http.DefaultRequestHeaders.Add("apikey", key);
        if (!key.StartsWith("sb_"))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
    }

    public async Task UploadAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        using var body = new StreamContent(content);
        body.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        using var response = await _http.PostAsync($"object/{_bucket}/{key}", body, cancellationToken);
        await EnsureSuccessAsync(response, "enviar o arquivo", cancellationToken);
    }

    public async Task<string> GetDownloadUrlAsync(string key, string? downloadName, CancellationToken cancellationToken = default)
    {
        using var response = await _http.PostAsJsonAsync(
            $"object/sign/{_bucket}/{key}", new { expiresIn = DownloadUrlSeconds }, cancellationToken);
        await EnsureSuccessAsync(response, "gerar o link de download", cancellationToken);

        var signed = await response.Content.ReadFromJsonAsync<SignedUrlResponse>(cancellationToken)
            ?? throw new InvalidOperationException("Resposta inválida do armazenamento.");
        var baseUrl = _http.BaseAddress!.ToString().TrimEnd('/');
        var url = $"{baseUrl}{signed.SignedURL}";
        return downloadName == null ? url : $"{url}&download={Uri.EscapeDataString(downloadName)}";
    }

    public async Task DeleteAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default)
    {
        if (keys.Count == 0) return;
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"object/{_bucket}")
        {
            Content = JsonContent.Create(new { prefixes = keys }),
        };
        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, "excluir os arquivos", cancellationToken);
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, string action, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode) return;
        var detail = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException($"Supabase Storage falhou ao {action} ({(int)response.StatusCode}): {detail}");
    }

    private record SignedUrlResponse(string SignedURL);
}

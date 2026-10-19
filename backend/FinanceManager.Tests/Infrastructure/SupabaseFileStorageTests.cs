using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FinanceManager.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Tests.Infrastructure;

public class SupabaseFileStorageTests
{
    private readonly FakeHandler _handler = new();

    private SupabaseFileStorage Storage(string key = "sb_secret_123", string? bucket = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://projeto.supabase.co/",
            ["Supabase:SecretKey"] = key,
        };
        if (bucket != null) settings["Supabase:Bucket"] = bucket;
        return new SupabaseFileStorage(new HttpClient(_handler), new ConfigurationBuilder().AddInMemoryCollection(settings).Build());
    }

    [Theory]
    [InlineData(null, "chave")]
    [InlineData("https://x.supabase.co", null)]
    [InlineData(" ", "chave")]
    [InlineData("https://x.supabase.co", "")]
    public void Missing_configuration_is_rejected(string? url, string? key)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Supabase:Url"] = url, ["Supabase:SecretKey"] = key })
            .Build();

        var error = Assert.Throws<InvalidOperationException>(() => new SupabaseFileStorage(new HttpClient(), config));

        Assert.Equal("Supabase:Url and Supabase:SecretKey must be configured to store files.", error.Message);
    }

    [Fact]
    public async Task A_new_style_secret_key_is_sent_only_as_apikey()
    {
        await Storage().UploadAsync("u/1", new MemoryStream([1, 2, 3]), "application/pdf");

        var request = Assert.Single(_handler.Requests);
        Assert.Equal(["sb_secret_123"], request.ApiKey);
        Assert.Null(request.Authorization);
    }

    [Fact]
    public async Task A_legacy_jwt_key_is_also_sent_as_bearer()
    {
        await Storage("eyJ.legacy.key").UploadAsync("u/1", new MemoryStream([1]), "text/plain");

        var request = Assert.Single(_handler.Requests);
        Assert.Equal("Bearer", request.Authorization!.Scheme);
        Assert.Equal("eyJ.legacy.key", request.Authorization.Parameter);
        Assert.Equal(["eyJ.legacy.key"], request.ApiKey);
    }

    [Fact]
    public async Task Upload_posts_the_content_to_the_object_path_of_the_default_bucket()
    {
        await Storage().UploadAsync("user/file", new MemoryStream([1, 2, 3]), "application/pdf");

        var request = Assert.Single(_handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("https://projeto.supabase.co/storage/v1/object/files/user/file", request.RequestUri!.ToString());
        Assert.Equal("application/pdf", request.ContentType);
        Assert.Equal([1, 2, 3], request.Body);
    }

    [Fact]
    public async Task A_failed_upload_reports_the_status_and_detail()
    {
        _handler.Respond(HttpStatusCode.RequestEntityTooLarge, "{\"error\":\"too big\"}");

        var error = await Assert.ThrowsAsync<HttpRequestException>(() =>
            Storage().UploadAsync("k", new MemoryStream([1]), "application/pdf"));

        Assert.Equal("Supabase Storage falhou ao enviar o arquivo (413): {\"error\":\"too big\"}", error.Message);
    }

    [Fact]
    public async Task Download_url_is_signed_for_two_minutes_with_the_download_name()
    {
        _handler.Respond(HttpStatusCode.OK, "{\"signedURL\":\"/object/sign/docs/user/file?token=abc\"}");

        var url = await Storage(bucket: "docs").GetDownloadUrlAsync("user/file", "extrato outubro.pdf");

        var request = Assert.Single(_handler.Requests);
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal("https://projeto.supabase.co/storage/v1/object/sign/docs/user/file", request.RequestUri!.ToString());
        Assert.Equal(120, JsonDocument.Parse(request.Body).RootElement.GetProperty("expiresIn").GetInt32());
        Assert.Equal("https://projeto.supabase.co/storage/v1/object/sign/docs/user/file?token=abc&download=extrato%20outubro.pdf", url);
    }

    [Fact]
    public async Task An_inline_url_has_no_download_name()
    {
        _handler.Respond(HttpStatusCode.OK, "{\"signedURL\":\"/object/sign/docs/user/file?token=abc\"}");

        var url = await Storage(bucket: "docs").GetDownloadUrlAsync("user/file", null);

        Assert.Equal("https://projeto.supabase.co/storage/v1/object/sign/docs/user/file?token=abc", url);
    }

    [Fact]
    public async Task A_failed_signing_is_reported()
    {
        _handler.Respond(HttpStatusCode.NotFound, "not found");

        var error = await Assert.ThrowsAsync<HttpRequestException>(() => Storage().GetDownloadUrlAsync("k", "a.pdf"));

        Assert.Equal("Supabase Storage falhou ao gerar o link de download (404): not found", error.Message);
    }

    [Fact]
    public async Task An_empty_signing_response_is_invalid()
    {
        _handler.Respond(HttpStatusCode.OK, "null");

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => Storage().GetDownloadUrlAsync("k", "a.pdf"));

        Assert.Equal("Resposta inválida do armazenamento.", error.Message);
    }

    [Fact]
    public async Task Delete_sends_all_prefixes_in_one_request()
    {
        await Storage().DeleteAsync(["u/1", "u/2"]);

        var request = Assert.Single(_handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal("https://projeto.supabase.co/storage/v1/object/files", request.RequestUri!.ToString());
        var prefixes = JsonDocument.Parse(request.Body).RootElement.GetProperty("prefixes").EnumerateArray().Select(p => p.GetString());
        Assert.Equal(["u/1", "u/2"], prefixes);
    }

    [Fact]
    public async Task Deleting_nothing_does_not_call_the_storage()
    {
        await Storage().DeleteAsync([]);

        Assert.Empty(_handler.Requests);
    }

    [Fact]
    public async Task A_failed_delete_is_reported()
    {
        _handler.Respond(HttpStatusCode.InternalServerError, "boom");

        var error = await Assert.ThrowsAsync<HttpRequestException>(() => Storage().DeleteAsync(["u/1"]));

        Assert.Equal("Supabase Storage falhou ao excluir os arquivos (500): boom", error.Message);
    }

    private sealed record Captured(HttpMethod Method, Uri? RequestUri, string[] ApiKey, AuthenticationHeaderValue? Authorization, string? ContentType, byte[] Body);

    private sealed class FakeHandler : HttpMessageHandler
    {
        private HttpStatusCode _status = HttpStatusCode.OK;
        private string _body = "{}";

        public List<Captured> Requests { get; } = [];

        public void Respond(HttpStatusCode status, string body)
        {
            _status = status;
            _body = body;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = request.Content == null ? [] : await request.Content.ReadAsByteArrayAsync(cancellationToken);
            var apiKey = request.Headers.TryGetValues("apikey", out var values) ? values.ToArray() : [];
            Requests.Add(new Captured(request.Method, request.RequestUri, apiKey, request.Headers.Authorization, request.Content?.Headers.ContentType?.MediaType, body));
            return new HttpResponseMessage(_status) { Content = new StringContent(_body, Encoding.UTF8, "application/json") };
        }
    }
}

namespace FinanceManager.Aplication.Storage;

/// <summary>Object storage for uploaded files (Supabase Storage in production).</summary>
public interface IFileStorage
{
    Task UploadAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>A short-lived URL that downloads the object as <paramref name="downloadName"/>.</summary>
    Task<string> GetDownloadUrlAsync(string key, string downloadName, CancellationToken cancellationToken = default);

    Task DeleteAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default);
}

namespace FinanceManager.Aplication.Storage;

public interface IFileStorage
{
    Task UploadAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default);

    Task<string> GetDownloadUrlAsync(string key, string downloadName, CancellationToken cancellationToken = default);

    Task DeleteAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default);
}

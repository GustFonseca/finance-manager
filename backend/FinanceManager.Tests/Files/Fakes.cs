using AutoMapper;
using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Storage;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Tests.Files;

public class FakeStore
{
    public List<Folder> Folders { get; } = [];
    public List<StoredFile> Files { get; } = [];
    public List<string> StoredKeys { get; } = [];

    public IMapper Mapper { get; } =
        new MapperConfiguration(cfg => cfg.AddMaps(typeof(FolderProfile).Assembly)).CreateMapper();

    public FakeFolderRepository FolderRepository => new(this);
    public FakeFileRepository FileRepository => new(this);
    public FakeFileStorage Storage => new(this);

    public Folder AddFolder(Guid userId, string name = "Pasta", bool isSystem = false)
    {
        var folder = new Folder { UserId = userId, Name = name, IsSystem = isSystem };
        Folders.Add(folder);
        return folder;
    }

    public StoredFile AddFile(Folder folder, string name = "a.pdf")
    {
        var file = new StoredFile { UserId = folder.UserId, FolderId = folder.Id, Name = name, Folder = folder };
        file.StorageKey = $"{folder.UserId}/{file.Id}";
        Files.Add(file);
        StoredKeys.Add(file.StorageKey);
        return file;
    }
}

public class FakeFolderRepository(FakeStore store) : IFolderRepository
{
    public Task<Folder?> GetByIdAsync(Guid id) => Task.FromResult(store.Folders.FirstOrDefault(f => f.Id == id));
    public Task<Folder> CreateAsync(Folder entity) { store.Folders.Add(entity); return Task.FromResult(entity); }
    public Task<Folder> UpdateAsync(Folder entity) => Task.FromResult(entity);
    public Task DeleteAsync(Folder entity) { store.Folders.Remove(entity); return Task.CompletedTask; }

    public Task<List<Folder>> GetByUserIdAsync(Guid userId, bool deleted) =>
        Task.FromResult(store.Folders.Where(f => f.UserId == userId && (f.DeletedAt != null) == deleted).ToList());

    public Task<Folder?> GetSystemFolderAsync(Guid userId) =>
        Task.FromResult(store.Folders.FirstOrDefault(f => f.UserId == userId && f.IsSystem));

    public Task DeleteRangeAsync(IEnumerable<Folder> folders)
    {
        foreach (var folder in folders.ToList()) store.Folders.Remove(folder);
        return Task.CompletedTask;
    }
}

public class FakeFileRepository(FakeStore store) : IStoredFileRepository
{
    public Task<StoredFile?> GetByIdAsync(Guid id) => Task.FromResult(store.Files.FirstOrDefault(f => f.Id == id));
    public Task<StoredFile> CreateAsync(StoredFile entity) { store.Files.Add(entity); return Task.FromResult(entity); }
    public Task<StoredFile> UpdateAsync(StoredFile entity) => Task.FromResult(entity);
    public Task DeleteAsync(StoredFile entity) { store.Files.Remove(entity); return Task.CompletedTask; }

    public Task<List<StoredFile>> GetByFolderIdAsync(Guid folderId) =>
        Task.FromResult(store.Files.Where(f => f.FolderId == folderId).ToList());

    public Task<List<StoredFile>> GetTrashedAsync(Guid userId) =>
        Task.FromResult(store.Files
            .Where(f => f.UserId == userId && f.DeletedAt != null &&
                        store.Folders.First(d => d.Id == f.FolderId).DeletedAt == null)
            .ToList());

    public Task<Dictionary<Guid, int>> CountActiveByFolderAsync(Guid userId) =>
        Task.FromResult(store.Files
            .Where(f => f.UserId == userId && f.DeletedAt == null)
            .GroupBy(f => f.FolderId)
            .ToDictionary(g => g.Key, g => g.Count()));

    public Task UpdateRangeAsync(IEnumerable<StoredFile> files) => Task.CompletedTask;

    public Task DeleteRangeAsync(IEnumerable<StoredFile> files)
    {
        foreach (var file in files.ToList()) store.Files.Remove(file);
        return Task.CompletedTask;
    }
}

public class FakeFileStorage(FakeStore store) : IFileStorage
{
    public Task UploadAsync(string key, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        store.StoredKeys.Add(key);
        return Task.CompletedTask;
    }

    public Task<string> GetDownloadUrlAsync(string key, string? downloadName, CancellationToken cancellationToken = default) =>
        Task.FromResult(downloadName == null ? $"https://storage.test/{key}" : $"https://storage.test/{key}?download={downloadName}");

    public Task DeleteAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default)
    {
        store.StoredKeys.RemoveAll(keys.Contains);
        return Task.CompletedTask;
    }
}

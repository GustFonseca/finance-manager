using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Storage;
using FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;
using FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;
using FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Events;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Tests.Files;

namespace FinanceManager.Tests.UseCases.Files;

public class FileAndTrashHandlersTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly FakeStore _store = new();

    [Fact]
    public async Task CreateFolder_trims_and_saves_the_name()
    {
        var dto = await new CreateFolderHandler(_store.FolderRepository).Handle(new CreateFolderCommand(Me, "  Notas fiscais  "));

        var folder = Assert.Single(_store.Folders);
        Assert.Equal("Notas fiscais", dto.Name);
        Assert.Equal(folder.Id, dto.Id);
        Assert.False(dto.IsSystem);
    }

    [Fact]
    public async Task CreateFolder_rejects_names_over_100_characters()
    {
        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new CreateFolderHandler(_store.FolderRepository).Handle(new CreateFolderCommand(Me, new string('a', 101))));

        Assert.Equal("O nome pode ter no máximo 100 caracteres.", error.Message);
    }

    [Fact]
    public async Task RenameFolder_renames_and_reports_the_active_file_count()
    {
        var folder = _store.AddFolder(Me, "Antiga");
        _store.AddFile(folder, "a.pdf");
        _store.AddFile(folder, "b.pdf").DeletedAt = DateTime.UtcNow;

        var dto = await new RenameFolderHandler(_store.FolderRepository, _store.FileRepository)
            .Handle(new RenameFolderCommand(Me, folder.Id, "Nova"));

        Assert.Equal("Nova", dto!.Name);
        Assert.Equal("Nova", folder.Name);
        Assert.Equal(1, dto.FileCount);
    }

    [Fact]
    public async Task RenameFolder_returns_null_for_missing_foreign_or_trashed_folders()
    {
        var foreign = _store.AddFolder(SomeoneElse);
        var trashed = _store.AddFolder(Me);
        trashed.DeletedAt = DateTime.UtcNow;
        var handler = new RenameFolderHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RenameFolderCommand(Me, Guid.NewGuid(), "x")));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RenameFolderCommand(Me, foreign.Id, "x")));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RenameFolderCommand(Me, trashed.Id, "x")));
    }

    [Fact]
    public async Task TrashFile_moves_the_file_to_the_trash_once()
    {
        var file = _store.AddFile(_store.AddFolder(Me));
        var handler = new TrashFileHandler(_store.FileRepository);

        await handler.Handle(new TrashFileCommand(Me, file.Id));
        Assert.NotNull(file.DeletedAt);
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new TrashFileCommand(Me, file.Id)));
    }

    [Fact]
    public async Task TrashFile_ignores_missing_and_foreign_files()
    {
        var foreign = _store.AddFile(_store.AddFolder(SomeoneElse));
        var handler = new TrashFileHandler(_store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new TrashFileCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new TrashFileCommand(Me, foreign.Id)));
        Assert.Null(foreign.DeletedAt);
    }

    [Fact]
    public async Task GetFolderFiles_lists_only_active_files()
    {
        var folder = _store.AddFolder(Me);
        _store.AddFile(folder, "ativo.pdf");
        _store.AddFile(folder, "lixo.pdf").DeletedAt = DateTime.UtcNow;

        var files = await new GetFolderFilesHandler(_store.FolderRepository, _store.FileRepository)
            .Handle(new GetFolderFilesQuery(Me, folder.Id));

        Assert.Equal(["ativo.pdf"], files!.Select(f => f.Name));
    }

    [Fact]
    public async Task GetFolderFiles_returns_null_for_missing_foreign_or_trashed_folders()
    {
        var foreign = _store.AddFolder(SomeoneElse);
        var trashed = _store.AddFolder(Me);
        trashed.DeletedAt = DateTime.UtcNow;
        var handler = new GetFolderFilesHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetFolderFilesQuery(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetFolderFilesQuery(Me, foreign.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetFolderFilesQuery(Me, trashed.Id)));
    }

    [Fact]
    public async Task UpdateFile_returns_null_for_missing_or_trashed_files_and_keeps_the_folder_when_unchanged()
    {
        var folder = _store.AddFolder(Me);
        var trashed = _store.AddFile(folder, "lixo.pdf");
        trashed.DeletedAt = DateTime.UtcNow;
        var file = _store.AddFile(folder, "a.pdf");
        var handler = new UpdateFileHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateFileCommand(Me, Guid.NewGuid(), "x", null)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateFileCommand(Me, trashed.Id, "x", null)));
        var dto = await handler.Handle(new UpdateFileCommand(Me, file.Id, null, folder.Id));

        Assert.Equal(("a.pdf", folder.Id), (dto!.Name, dto.FolderId));
    }

    [Fact]
    public async Task GetFileDownloadUrl_signs_the_users_active_file()
    {
        var file = _store.AddFile(_store.AddFolder(Me), "nota.pdf");
        var trashed = _store.AddFile(_store.AddFolder(Me), "velha.pdf");
        trashed.DeletedAt = DateTime.UtcNow;
        var handler = new GetFileDownloadUrlHandler(_store.FileRepository, _store.Storage);

        var url = await handler.Handle(new GetFileDownloadUrlQuery(Me, file.Id));

        Assert.Equal($"https://storage.test/{file.StorageKey}?download=nota.pdf", url);
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetFileDownloadUrlQuery(Me, trashed.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new GetFileDownloadUrlQuery(Me, Guid.NewGuid())));
    }

    [Fact]
    public async Task GetFileView_returns_an_inline_link_with_the_file_details()
    {
        var file = _store.AddFile(_store.AddFolder(Me), "nota.jpg");
        var trashed = _store.AddFile(_store.AddFolder(Me), "velha.jpg");
        trashed.DeletedAt = DateTime.UtcNow;
        var foreign = _store.AddFile(_store.AddFolder(SomeoneElse), "outra.jpg");
        var handler = new FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewHandler(_store.FileRepository, _store.Storage);

        var view = await handler.Handle(new FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewQuery(Me, file.Id));

        Assert.Equal(($"https://storage.test/{file.StorageKey}", "nota.jpg", file.ContentType, file.SizeBytes), (view!.Url, view.Name, view.ContentType, view.SizeBytes));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewQuery(Me, trashed.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewQuery(Me, foreign.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewQuery(Me, Guid.NewGuid())));
    }

    [Fact]
    public async Task Upload_returns_null_when_the_folder_is_missing_foreign_or_trashed()
    {
        var foreign = _store.AddFolder(SomeoneElse);
        var trashed = _store.AddFolder(Me);
        trashed.DeletedAt = DateTime.UtcNow;
        var handler = new UploadFileHandler(_store.FolderRepository, _store.FileRepository, _store.Storage);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UploadFileCommand(Me, Guid.NewGuid(), "a.pdf", "application/pdf", 1, Stream.Null)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UploadFileCommand(Me, foreign.Id, "a.pdf", "application/pdf", 1, Stream.Null)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UploadFileCommand(Me, trashed.Id, "a.pdf", "application/pdf", 1, Stream.Null)));
        Assert.Empty(_store.StoredKeys);
    }

    [Fact]
    public async Task Upload_keeps_the_given_content_type()
    {
        var folder = _store.AddFolder(Me);

        var dto = await new UploadFileHandler(_store.FolderRepository, _store.FileRepository, _store.Storage)
            .Handle(new UploadFileCommand(Me, folder.Id, "nota.pdf", "application/pdf", 2048, Stream.Null));

        Assert.Equal(("application/pdf", 2048L), (dto!.ContentType, dto.SizeBytes));
    }

    [Fact]
    public async Task Upload_removes_the_stored_object_when_saving_the_record_fails()
    {
        var folder = _store.AddFolder(Me);
        var handler = new UploadFileHandler(_store.FolderRepository, new FailingFileRepository(_store), _store.Storage);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(new UploadFileCommand(Me, folder.Id, "nota.pdf", "application/pdf", 10, Stream.Null)));

        Assert.Empty(_store.StoredKeys);
        Assert.Empty(_store.Files);
    }

    [Fact]
    public async Task TrashFolder_ignores_folders_already_in_the_trash()
    {
        var folder = _store.AddFolder(Me);
        var handler = new TrashFolderHandler(_store.FolderRepository, _store.FileRepository);

        await handler.Handle(new TrashFolderCommand(Me, folder.Id));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new TrashFolderCommand(Me, folder.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new TrashFolderCommand(Me, Guid.NewGuid())));
    }

    [Fact]
    public async Task GetTrash_lists_trashed_folders_and_loose_files_with_their_folder_name()
    {
        var kept = _store.AddFolder(Me, "Mantida");
        var loose = _store.AddFile(kept, "solto.pdf");
        loose.DeletedAt = DateTime.UtcNow;
        _store.AddFile(kept, "ativo.pdf");
        var trashed = _store.AddFolder(Me, "Lixo");
        _store.AddFile(trashed, "dentro.pdf");
        await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new TrashFolderCommand(Me, trashed.Id));

        var trash = await new GetTrashHandler(_store.FolderRepository, _store.FileRepository).Handle(new GetTrashQuery(Me));

        var folder = Assert.Single(trash.Folders);
        Assert.Equal(("Lixo", 1), (folder.Name, folder.FileCount));
        var file = Assert.Single(trash.Files);
        Assert.Equal(("solto.pdf", "Mantida"), (file.Name, file.FolderName));
    }

    [Fact]
    public async Task RestoreFile_brings_back_a_loose_file()
    {
        var file = _store.AddFile(_store.AddFolder(Me));
        file.DeletedAt = DateTime.UtcNow;

        await new RestoreFileHandler(_store.FolderRepository, _store.FileRepository).Handle(new RestoreFileCommand(Me, file.Id));

        Assert.Null(file.DeletedAt);
    }

    [Fact]
    public async Task RestoreFile_ignores_active_missing_and_orphan_files()
    {
        var active = _store.AddFile(_store.AddFolder(Me));
        var orphan = _store.AddFile(_store.AddFolder(Me));
        orphan.DeletedAt = DateTime.UtcNow;
        _store.Folders.Remove(orphan.Folder);
        var handler = new RestoreFileHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RestoreFileCommand(Me, active.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RestoreFileCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new RestoreFileCommand(Me, orphan.Id)));
        Assert.NotNull(orphan.DeletedAt);
    }

    [Fact]
    public async Task RestoreFolder_ignores_active_missing_and_foreign_folders()
    {
        var active = _store.AddFolder(Me);
        var foreign = _store.AddFolder(SomeoneElse);
        foreign.DeletedAt = DateTime.UtcNow;
        var handler = new RestoreFolderHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RestoreFolderCommand(Me, active.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RestoreFolderCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new RestoreFolderCommand(Me, foreign.Id)));
        Assert.NotNull(foreign.DeletedAt);
    }

    [Fact]
    public async Task DeleteFileForever_removes_a_trashed_file_and_its_object()
    {
        var file = _store.AddFile(_store.AddFolder(Me));
        file.DeletedAt = DateTime.UtcNow;

        await new DeleteFileForeverHandler(_store.FileRepository).Handle(new DeleteFileForeverCommand(Me, file.Id));

        Assert.Empty(_store.Files);
        Assert.Equal([new StoredFilePurged(file.Id, file.StorageKey)], file.DomainEvents);
    }

    [Fact]
    public async Task Purged_files_are_removed_from_storage_in_one_batch()
    {
        var first = _store.AddFile(_store.AddFolder(Me));
        var second = _store.AddFile(_store.AddFolder(Me));
        var kept = _store.AddFile(_store.AddFolder(Me));

        await new StoredFilePurgedHandler(_store.Storage).Handle(
            [new StoredFilePurged(first.Id, first.StorageKey), new StoredFilePurged(second.Id, second.StorageKey), new StoredFilePurged(first.Id, first.StorageKey)],
            CancellationToken.None);

        Assert.Equal([kept.StorageKey], _store.StoredKeys);
    }

    [Fact]
    public async Task DeleteFileForever_only_works_on_the_users_trashed_files()
    {
        var active = _store.AddFile(_store.AddFolder(Me));
        var foreign = _store.AddFile(_store.AddFolder(SomeoneElse));
        foreign.DeletedAt = DateTime.UtcNow;
        var handler = new DeleteFileForeverHandler(_store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFileForeverCommand(Me, active.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFileForeverCommand(Me, foreign.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFileForeverCommand(Me, Guid.NewGuid())));
        Assert.Equal(2, _store.Files.Count);
        Assert.All(_store.Files, f => Assert.Empty(f.DomainEvents));
    }

    [Fact]
    public async Task DeleteFolderForever_removes_a_trashed_folder_with_all_its_files()
    {
        var kept = _store.AddFile(_store.AddFolder(Me, "Mantida"));
        var folder = _store.AddFolder(Me, "Lixo");
        _store.AddFile(folder, "a.pdf");
        _store.AddFile(folder, "b.pdf");
        await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new TrashFolderCommand(Me, folder.Id));

        var inside = _store.Files.Where(f => f.FolderId == folder.Id).ToList();

        await new DeleteFolderForeverHandler(_store.FolderRepository, _store.FileRepository)
            .Handle(new DeleteFolderForeverCommand(Me, folder.Id));

        Assert.DoesNotContain(folder, _store.Folders);
        Assert.Equal([kept], _store.Files);
        Assert.Equal(inside.Select(f => new StoredFilePurged(f.Id, f.StorageKey)), inside.SelectMany(f => f.DomainEvents));
        Assert.Empty(kept.DomainEvents);
    }

    [Fact]
    public async Task DeleteFolderForever_only_works_on_the_users_trashed_folders()
    {
        var active = _store.AddFolder(Me);
        var foreign = _store.AddFolder(SomeoneElse);
        foreign.DeletedAt = DateTime.UtcNow;
        var handler = new DeleteFolderForeverHandler(_store.FolderRepository, _store.FileRepository);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFolderForeverCommand(Me, active.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFolderForeverCommand(Me, foreign.Id)));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteFolderForeverCommand(Me, Guid.NewGuid())));
        Assert.Equal(2, _store.Folders.Count);
        Assert.All(_store.Files, f => Assert.Empty(f.DomainEvents));
    }

    private sealed class FailingFileRepository(FakeStore store) : IStoredFileRepository
    {
        private readonly FakeFileRepository _inner = store.FileRepository;

        public Task<StoredFile> CreateAsync(StoredFile entity) => throw new InvalidOperationException("banco fora do ar");
        public Task<StoredFile?> GetByIdAsync(Guid id) => _inner.GetByIdAsync(id);
        public Task<StoredFile> UpdateAsync(StoredFile entity) => _inner.UpdateAsync(entity);
        public Task DeleteAsync(StoredFile entity) => _inner.DeleteAsync(entity);
        public Task<List<StoredFile>> GetByFolderIdAsync(Guid folderId) => _inner.GetByFolderIdAsync(folderId);
        public Task<List<StoredFile>> GetByFolderIdsAsync(IReadOnlyCollection<Guid> folderIds) => _inner.GetByFolderIdsAsync(folderIds);
        public Task<List<StoredFile>> GetTrashedAsync(Guid userId) => _inner.GetTrashedAsync(userId);
        public Task<Dictionary<Guid, int>> CountActiveByFolderAsync(Guid userId) => _inner.CountActiveByFolderAsync(userId);
        public Task UpdateRangeAsync(IEnumerable<StoredFile> files) => _inner.UpdateRangeAsync(files);
        public Task DeleteRangeAsync(IEnumerable<StoredFile> files) => _inner.DeleteRangeAsync(files);
    }
}

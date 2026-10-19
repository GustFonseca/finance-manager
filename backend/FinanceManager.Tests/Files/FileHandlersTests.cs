using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;
using FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;
using FinanceManager.Aplication.UseCases.Folders.Queries.GetFolders;
using FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;
using FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Tests.Files;

public class FileHandlersTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly FakeStore _store = new();

    [Fact]
    public async Task GetFolders_creates_the_imports_folder_once()
    {
        var handler = new GetFoldersHandler(_store.FolderRepository, _store.FileRepository, _store.Mapper);

        await handler.Handle(new GetFoldersQuery(Me));
        var folders = await handler.Handle(new GetFoldersQuery(Me));

        var system = Assert.Single(folders);
        Assert.True(system.IsSystem);
        Assert.Equal(Folder.ImportsFolderName, system.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("a/b")]
    [InlineData("nome?")]
    public async Task CreateFolder_rejects_invalid_names(string name)
    {
        var handler = new CreateFolderHandler(_store.FolderRepository, _store.Mapper);

        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new CreateFolderCommand(Me, name)));
    }

    [Fact]
    public async Task The_system_folder_cannot_be_renamed_or_trashed()
    {
        var system = _store.AddFolder(Me, Folder.ImportsFolderName, isSystem: true);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new RenameFolderHandler(_store.FolderRepository, _store.FileRepository, _store.Mapper)
                .Handle(new RenameFolderCommand(Me, system.Id, "Outro nome")));
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new TrashFolderHandler(_store.FolderRepository, _store.FileRepository)
                .Handle(new TrashFolderCommand(Me, system.Id)));
    }

    [Fact]
    public async Task Another_users_folder_and_file_are_not_found()
    {
        var folder = _store.AddFolder(SomeoneElse);
        var file = _store.AddFile(folder);

        var trashed = await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository)
            .Handle(new TrashFolderCommand(Me, folder.Id));
        var url = await new GetFileDownloadUrlHandler(_store.FileRepository, _store.Storage)
            .Handle(new GetFileDownloadUrlQuery(Me, file.Id));

        Assert.False(trashed);
        Assert.Null(url);
        Assert.Null(folder.DeletedAt);
    }

    [Fact]
    public async Task Moving_a_file_into_another_users_folder_is_rejected()
    {
        var mine = _store.AddFile(_store.AddFolder(Me));
        var theirs = _store.AddFolder(SomeoneElse);
        var handler = new UpdateFileHandler(_store.FolderRepository, _store.FileRepository, _store.Mapper);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            handler.Handle(new UpdateFileCommand(Me, mine.Id, null, theirs.Id)));
        Assert.NotEqual(theirs.Id, mine.FolderId);
    }

    [Fact]
    public async Task Moving_and_renaming_a_file_only_changes_metadata()
    {
        var file = _store.AddFile(_store.AddFolder(Me), "extrato.csv");
        var target = _store.AddFolder(Me, "Destino");
        var key = file.StorageKey;

        var dto = await new UpdateFileHandler(_store.FolderRepository, _store.FileRepository, _store.Mapper)
            .Handle(new UpdateFileCommand(Me, file.Id, "outubro.csv", target.Id));

        Assert.Equal(target.Id, dto!.FolderId);
        Assert.Equal("outubro.csv", dto.Name);
        Assert.Equal(key, file.StorageKey);
    }

    [Fact]
    public async Task Upload_rejects_files_over_the_size_limit()
    {
        var folder = _store.AddFolder(Me);
        var handler = new UploadFileHandler(_store.FolderRepository, _store.FileRepository, _store.Storage, _store.Mapper);

        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new UploadFileCommand(
            Me, folder.Id, "grande.zip", "application/zip", UploadFileHandler.MaxSizeBytes + 1, Stream.Null)));
        Assert.Empty(_store.StoredKeys);
    }

    [Fact]
    public async Task Upload_stores_the_object_under_a_key_independent_of_the_name()
    {
        var folder = _store.AddFolder(Me);
        var handler = new UploadFileHandler(_store.FolderRepository, _store.FileRepository, _store.Storage, _store.Mapper);

        var dto = await handler.Handle(new UploadFileCommand(Me, folder.Id, "fakepath/nota.pdf", "", 10, Stream.Null));

        var file = Assert.Single(_store.Files);
        Assert.Equal("nota.pdf", dto!.Name);
        Assert.Equal("application/octet-stream", file.ContentType);
        Assert.Equal($"{Me}/{file.Id}", file.StorageKey);
        Assert.Contains(file.StorageKey, _store.StoredKeys);
    }

    [Fact]
    public async Task Restoring_a_folder_brings_back_only_the_files_trashed_with_it()
    {
        var folder = _store.AddFolder(Me);
        var trashedEarlier = _store.AddFile(folder, "antigo.pdf");
        var inFolder = _store.AddFile(folder, "atual.pdf");
        trashedEarlier.DeletedAt = DateTime.UtcNow.AddDays(-1);

        await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new TrashFolderCommand(Me, folder.Id));
        var trash = await new GetTrashHandler(_store.FolderRepository, _store.FileRepository, _store.Mapper).Handle(new GetTrashQuery(Me));
        await new RestoreFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new RestoreFolderCommand(Me, folder.Id));

        Assert.Equal(1, Assert.Single(trash.Folders).FileCount);
        Assert.Null(folder.DeletedAt);
        Assert.Null(inFolder.DeletedAt);
        Assert.NotNull(trashedEarlier.DeletedAt);
    }

    [Fact]
    public async Task A_file_trashed_with_its_folder_is_not_restored_on_its_own()
    {
        var folder = _store.AddFolder(Me);
        var file = _store.AddFile(folder);
        await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new TrashFolderCommand(Me, folder.Id));

        var restored = await new RestoreFileHandler(_store.FolderRepository, _store.FileRepository)
            .Handle(new RestoreFileCommand(Me, file.Id));

        Assert.False(restored);
        Assert.NotNull(file.DeletedAt);
    }

    [Fact]
    public async Task EmptyTrash_deletes_trashed_items_and_their_objects_only()
    {
        var kept = _store.AddFile(_store.AddFolder(Me, "Mantida"));
        var trashedFolder = _store.AddFolder(Me, "Lixo");
        _store.AddFile(trashedFolder);
        var loose = _store.AddFile(_store.AddFolder(Me, "Outra"));
        await new TrashFolderHandler(_store.FolderRepository, _store.FileRepository).Handle(new TrashFolderCommand(Me, trashedFolder.Id));
        loose.DeletedAt = DateTime.UtcNow;

        var removed = await new EmptyTrashHandler(_store.FolderRepository, _store.FileRepository, _store.Storage, _store.Work)
            .Handle(new EmptyTrashCommand(Me));

        Assert.Equal(2, removed);
        Assert.DoesNotContain(trashedFolder, _store.Folders);
        await _store.Work.FlushAsync();
        Assert.Equal([kept.StorageKey], _store.StoredKeys);
        Assert.Contains(kept, _store.Files);
    }
}

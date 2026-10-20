using FinanceManager.Aplication.Exceptions;
using System.Text;
using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;
using FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;
using FinanceManager.Aplication.UseCases.Folders.Queries.GetFolders;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;
using FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.Api;

public class FilesFoldersAndTrashControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid Known = Guid.NewGuid();

    private readonly FakeMediator _mediator = new();

    private FilesController Files => new FilesController(_mediator).SignedIn(Me);
    private FoldersController Folders => new FoldersController(_mediator).SignedIn(Me);
    private TrashController Trash => new TrashController(_mediator).SignedIn(Me);

    private static IFormFile Form(string name, string content, string contentType = "application/pdf")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "files", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }

    [Fact]
    public async Task Files_Update_returns_200_or_404()
    {
        var folderId = Guid.NewGuid();
        _mediator.Returns<UpdateFileCommand>(c => c.FileId == Known ? new StoredFileDto { Id = Known, Name = c.Name! } : throw new NotFoundException("não encontrado"));

        var found = await Files.Update(Known, new UpdateFileRequest { Name = "novo.pdf", FolderId = folderId });

        Assert.Equal("novo.pdf", Assert.IsType<StoredFileDto>(Assert.IsType<OkObjectResult>(found.Result).Value).Name);
        await Assert.ThrowsAsync<NotFoundException>(() => Files.Update(Guid.NewGuid(), new UpdateFileRequest { Name = "x" }));
        Assert.Equal(new UpdateFileCommand(Me, Known, "novo.pdf", folderId), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Files_Delete_returns_204_or_404()
    {
        _mediator.Returns<TrashFileCommand>(c => c.FileId == Known ? true : throw new NotFoundException("não encontrado"));

        Assert.IsType<NoContentResult>(await Files.Delete(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Files.Delete(Guid.NewGuid()));
    }

    [Fact]
    public async Task Files_Download_returns_the_signed_url_or_404()
    {
        _mediator.Returns<GetFileDownloadUrlQuery>(q => q.FileId == Known ? "https://storage/x" : throw new NotFoundException("não encontrado"));

        var found = await Files.Download(Known);

        Assert.Equal("https://storage/x", Assert.IsType<FileDownloadDto>(Assert.IsType<OkObjectResult>(found.Result).Value).Url);
        await Assert.ThrowsAsync<NotFoundException>(() => Files.Download(Guid.NewGuid()));
    }

    [Fact]
    public async Task Files_View_returns_the_inline_link_or_404()
    {
        var view = new FileViewDto { Url = "https://storage/x", Name = "nota.jpg", ContentType = "image/jpeg" };
        _mediator.Returns<FinanceManager.Aplication.UseCases.Files.Queries.GetFileView.GetFileViewQuery>(q => q.FileId == Known ? view : throw new NotFoundException("não encontrado"));

        Assert.Same(view, Assert.IsType<OkObjectResult>((await Files.View(Known)).Result).Value);
        await Assert.ThrowsAsync<NotFoundException>(() => Files.View(Guid.NewGuid()));
    }

    [Fact]
    public async Task Folders_GetAll_and_Create()
    {
        var folders = new List<FolderDto>();
        _mediator.Returns<GetFoldersQuery>(_ => folders);
        _mediator.Returns<CreateFolderCommand>(c => new FolderDto { Id = Known, Name = c.Name });

        var all = await Folders.GetAll();
        var created = await Folders.Create(new FolderNameRequest { Name = "Notas" });

        Assert.Same(folders, Assert.IsType<OkObjectResult>(all.Result).Value);
        var result = Assert.IsType<CreatedResult>(created.Result);
        Assert.Equal($"/api/folders/{Known}", result.Location);
        Assert.Equal(new CreateFolderCommand(Me, "Notas"), _mediator.Sent[1]);
    }

    [Fact]
    public async Task Folders_Rename_returns_200_or_404()
    {
        _mediator.Returns<RenameFolderCommand>(c => c.FolderId == Known ? new FolderDto { Id = Known, Name = c.Name } : throw new NotFoundException("não encontrado"));

        var found = await Folders.Rename(Known, new FolderNameRequest { Name = "Nova" });

        Assert.Equal("Nova", Assert.IsType<FolderDto>(Assert.IsType<OkObjectResult>(found.Result).Value).Name);
        await Assert.ThrowsAsync<NotFoundException>(() => Folders.Rename(Guid.NewGuid(), new FolderNameRequest { Name = "Nova" }));
    }

    [Fact]
    public async Task Folders_Delete_returns_204_or_404()
    {
        _mediator.Returns<TrashFolderCommand>(c => c.FolderId == Known ? true : throw new NotFoundException("não encontrado"));

        Assert.IsType<NoContentResult>(await Folders.Delete(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Folders.Delete(Guid.NewGuid()));
    }

    [Fact]
    public async Task Folders_GetFiles_returns_200_or_404()
    {
        var files = new List<StoredFileDto>();
        _mediator.Returns<GetFolderFilesQuery>(q => q.FolderId == Known ? files : throw new NotFoundException("não encontrado"));

        var found = await Folders.GetFiles(Known);

        Assert.Same(files, Assert.IsType<OkObjectResult>(found.Result).Value);
        await Assert.ThrowsAsync<NotFoundException>(() => Folders.GetFiles(Guid.NewGuid()));
    }

    [Fact]
    public async Task Folders_Upload_without_files_is_400()
    {
        var result = await Folders.Upload(Known, []);

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Nenhum arquivo enviado.", bad.Value!.GetType().GetProperty("message")!.GetValue(bad.Value));
        Assert.Empty(_mediator.Sent);
    }

    [Fact]
    public async Task Folders_Upload_sends_every_file_with_its_metadata()
    {
        var contents = new List<string>();
        _mediator.Returns<UploadFileCommand>(c =>
        {
            contents.Add(new StreamReader(c.Content).ReadToEnd());
            return new StoredFileDto { Name = c.FileName, ContentType = c.ContentType, SizeBytes = c.SizeBytes };
        });

        var result = await Folders.Upload(Known, [Form("a.pdf", "abc"), Form("b.csv", "12345", "text/csv")]);

        var uploaded = Assert.IsType<List<StoredFileDto>>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal([("a.pdf", "application/pdf", 3L), ("b.csv", "text/csv", 5L)], uploaded.Select(f => (f.Name, f.ContentType, f.SizeBytes)));
        Assert.Equal(["abc", "12345"], contents);
        Assert.All(_mediator.Sent.Cast<UploadFileCommand>(), c => Assert.Equal((Me, Known), (c.UserId, c.FolderId)));
    }

    [Fact]
    public async Task Folders_Upload_to_a_missing_folder_is_404()
    {
        _mediator.Throws<UploadFileCommand>(new NotFoundException("Pasta não encontrada."));

        await Assert.ThrowsAsync<NotFoundException>(() => Folders.Upload(Guid.NewGuid(), [Form("a.pdf", "abc"), Form("b.pdf", "abc")]));

        Assert.Single(_mediator.Sent);
    }

    [Fact]
    public async Task Trash_Get_and_Empty()
    {
        var trash = new TrashDto();
        _mediator.Returns<GetTrashQuery>(_ => trash);
        _mediator.Returns<EmptyTrashCommand>(_ => 3);

        var get = await Trash.Get();
        var empty = await Trash.EmptyTrash();

        Assert.Same(trash, Assert.IsType<OkObjectResult>(get.Result).Value);
        Assert.IsType<NoContentResult>(empty);
        Assert.Equal(new EmptyTrashCommand(Me), _mediator.Sent[1]);
    }

    [Fact]
    public async Task Trash_restore_and_delete_return_204_or_404()
    {
        _mediator.Returns<RestoreFolderCommand>(c => c.FolderId == Known ? true : throw new NotFoundException("não encontrado"));
        _mediator.Returns<RestoreFileCommand>(c => c.FileId == Known ? true : throw new NotFoundException("não encontrado"));
        _mediator.Returns<DeleteFolderForeverCommand>(c => c.FolderId == Known ? true : throw new NotFoundException("não encontrado"));
        _mediator.Returns<DeleteFileForeverCommand>(c => c.FileId == Known ? true : throw new NotFoundException("não encontrado"));
        var other = Guid.NewGuid();

        Assert.IsType<NoContentResult>(await Trash.RestoreFolder(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Trash.RestoreFolder(other));
        Assert.IsType<NoContentResult>(await Trash.RestoreFile(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Trash.RestoreFile(other));
        Assert.IsType<NoContentResult>(await Trash.DeleteFolder(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Trash.DeleteFolder(other));
        Assert.IsType<NoContentResult>(await Trash.DeleteFile(Known));
        await Assert.ThrowsAsync<NotFoundException>(() => Trash.DeleteFile(other));
    }
}

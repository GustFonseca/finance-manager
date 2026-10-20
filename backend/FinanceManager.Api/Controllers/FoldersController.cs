using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Files.Commands.UploadFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFolderFiles;
using FinanceManager.Aplication.UseCases.Folders.Commands.CreateFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.RenameFolder;
using FinanceManager.Aplication.UseCases.Folders.Commands.TrashFolder;
using FinanceManager.Aplication.UseCases.Folders.Queries.GetFolders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/folders")]
[Authorize]
public class FoldersController(IMediator mediator) : AppController(mediator)
{
    private const long MaxUploadRequestBytes = 100 * 1024 * 1024;



    [HttpGet]
    public async Task<ActionResult<List<FolderDto>>> GetAll()
    {
        var folders = await Mediator.Send(new GetFoldersQuery(UserId));
        return Ok(folders);
    }

    [HttpPost]
    public async Task<ActionResult<FolderDto>> Create([FromBody] FolderNameRequest request)
    {
        var folder = await Mediator.Send(new CreateFolderCommand(UserId, request.Name));
        return Created($"/api/folders/{folder.Id}", folder);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FolderDto>> Rename(Guid id, [FromBody] FolderNameRequest request)
    {
        var folder = await Mediator.Send(new RenameFolderCommand(UserId, id, request.Name));
        return Ok(folder);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new TrashFolderCommand(UserId, id));
        return NoContent();
    }

    [HttpGet("{id}/files")]
    public async Task<ActionResult<List<StoredFileDto>>> GetFiles(Guid id)
    {
        var files = await Mediator.Send(new GetFolderFilesQuery(UserId, id));
        return Ok(files);
    }

    [HttpPost("{id}/files")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadRequestBytes)]
    public async Task<ActionResult<List<StoredFileDto>>> Upload(Guid id, [FromForm] List<IFormFile> files)
    {
        if (files.Count == 0) return BadRequest(new { message = "Nenhum arquivo enviado." });

        var uploaded = new List<StoredFileDto>();
        foreach (var file in files)
        {
            await using var content = file.OpenReadStream();
            var dto = await Mediator.Send(new UploadFileCommand(
                UserId, id, file.FileName, file.ContentType, file.Length, content));
            uploaded.Add(dto);
        }

        return Ok(uploaded);
    }
}

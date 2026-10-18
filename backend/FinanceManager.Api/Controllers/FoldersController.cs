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
public class FoldersController : ControllerBase
{
    private const long MaxUploadRequestBytes = 100 * 1024 * 1024;

    private readonly IMediator _mediator;

    public FoldersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<FolderDto>>> GetAll()
    {
        var folders = await _mediator.Send(new GetFoldersQuery(GetUserId()));
        return Ok(folders);
    }

    [HttpPost]
    public async Task<ActionResult<FolderDto>> Create([FromBody] FolderNameRequest request)
    {
        var folder = await _mediator.Send(new CreateFolderCommand(GetUserId(), request.Name));
        return Created($"/api/folders/{folder.Id}", folder);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FolderDto>> Rename(Guid id, [FromBody] FolderNameRequest request)
    {
        var folder = await _mediator.Send(new RenameFolderCommand(GetUserId(), id, request.Name));
        if (folder == null) return NotFound();
        return Ok(folder);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var trashed = await _mediator.Send(new TrashFolderCommand(GetUserId(), id));
        if (!trashed) return NotFound();
        return NoContent();
    }

    [HttpGet("{id}/files")]
    public async Task<ActionResult<List<StoredFileDto>>> GetFiles(Guid id)
    {
        var files = await _mediator.Send(new GetFolderFilesQuery(GetUserId(), id));
        if (files == null) return NotFound();
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
            var dto = await _mediator.Send(new UploadFileCommand(
                GetUserId(), id, file.FileName, file.ContentType, file.Length, content));
            if (dto == null) return NotFound();
            uploaded.Add(dto);
        }

        return Ok(uploaded);
    }
}

using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IMediator _mediator;

    public FilesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpPut("{id}")]
    public async Task<ActionResult<StoredFileDto>> Update(Guid id, [FromBody] UpdateFileRequest request)
    {
        var file = await _mediator.Send(new UpdateFileCommand(GetUserId(), id, request.Name, request.FolderId));
        if (file == null) return NotFound();
        return Ok(file);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var trashed = await _mediator.Send(new TrashFileCommand(GetUserId(), id));
        if (!trashed) return NotFound();
        return NoContent();
    }

    [HttpGet("{id}/download")]
    public async Task<ActionResult<FileDownloadDto>> Download(Guid id)
    {
        var url = await _mediator.Send(new GetFileDownloadUrlQuery(GetUserId(), id));
        if (url == null) return NotFound();
        return Ok(new FileDownloadDto { Url = url });
    }
}

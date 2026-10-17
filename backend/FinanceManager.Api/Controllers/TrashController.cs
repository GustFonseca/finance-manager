using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFileForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.DeleteFolderForever;
using FinanceManager.Aplication.UseCases.Trash.Commands.EmptyTrash;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFile;
using FinanceManager.Aplication.UseCases.Trash.Commands.RestoreFolder;
using FinanceManager.Aplication.UseCases.Trash.Queries.GetTrash;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/trash")]
[Authorize]
public class TrashController : ControllerBase
{
    private readonly IMediator _mediator;

    public TrashController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<TrashDto>> Get()
    {
        var trash = await _mediator.Send(new GetTrashQuery(GetUserId()));
        return Ok(trash);
    }

    /// <summary>Permanently deletes everything in the trash.</summary>
    [HttpDelete]
    public async Task<IActionResult> EmptyTrash()
    {
        await _mediator.Send(new EmptyTrashCommand(GetUserId()));
        return NoContent();
    }

    [HttpPost("folders/{id}/restore")]
    public async Task<IActionResult> RestoreFolder(Guid id)
    {
        var restored = await _mediator.Send(new RestoreFolderCommand(GetUserId(), id));
        if (!restored) return NotFound();
        return NoContent();
    }

    [HttpPost("files/{id}/restore")]
    public async Task<IActionResult> RestoreFile(Guid id)
    {
        var restored = await _mediator.Send(new RestoreFileCommand(GetUserId(), id));
        if (!restored) return NotFound();
        return NoContent();
    }

    [HttpDelete("folders/{id}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        var deleted = await _mediator.Send(new DeleteFolderForeverCommand(GetUserId(), id));
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpDelete("files/{id}")]
    public async Task<IActionResult> DeleteFile(Guid id)
    {
        var deleted = await _mediator.Send(new DeleteFileForeverCommand(GetUserId(), id));
        if (!deleted) return NotFound();
        return NoContent();
    }
}

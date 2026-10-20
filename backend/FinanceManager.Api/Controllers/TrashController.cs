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
public class TrashController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<TrashDto>> Get()
    {
        var trash = await Mediator.Send(new GetTrashQuery(UserId));
        return Ok(trash);
    }

    [HttpDelete]
    public async Task<IActionResult> EmptyTrash()
    {
        await Mediator.Send(new EmptyTrashCommand(UserId));
        return NoContent();
    }

    [HttpPost("folders/{id}/restore")]
    public async Task<IActionResult> RestoreFolder(Guid id)
    {
        await Mediator.Send(new RestoreFolderCommand(UserId, id));
        return NoContent();
    }

    [HttpPost("files/{id}/restore")]
    public async Task<IActionResult> RestoreFile(Guid id)
    {
        await Mediator.Send(new RestoreFileCommand(UserId, id));
        return NoContent();
    }

    [HttpDelete("folders/{id}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        await Mediator.Send(new DeleteFolderForeverCommand(UserId, id));
        return NoContent();
    }

    [HttpDelete("files/{id}")]
    public async Task<IActionResult> DeleteFile(Guid id)
    {
        await Mediator.Send(new DeleteFileForeverCommand(UserId, id));
        return NoContent();
    }
}

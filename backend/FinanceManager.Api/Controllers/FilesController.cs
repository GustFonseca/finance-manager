using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Files.Commands.TrashFile;
using FinanceManager.Aplication.UseCases.Files.Commands.UpdateFile;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileDownloadUrl;
using FinanceManager.Aplication.UseCases.Files.Queries.GetFileView;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController(IMediator mediator) : AppController(mediator)
{
    [HttpPut("{id}")]
    public async Task<ActionResult<StoredFileDto>> Update(Guid id, [FromBody] UpdateFileRequest request)
    {
        var file = await Mediator.Send(new UpdateFileCommand(UserId, id, request.Name, request.FolderId));
        return Ok(file);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new TrashFileCommand(UserId, id));
        return NoContent();
    }

    [HttpGet("{id}/view")]
    public async Task<ActionResult<FileViewDto>> View(Guid id)
    {
        var view = await Mediator.Send(new GetFileViewQuery(UserId, id));
        return Ok(view);
    }

    [HttpGet("{id}/download")]
    public async Task<ActionResult<FileDownloadDto>> Download(Guid id)
    {
        var url = await Mediator.Send(new GetFileDownloadUrlQuery(UserId, id));
        return Ok(new FileDownloadDto { Url = url });
    }
}

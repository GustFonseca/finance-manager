using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;
using FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;
using FinanceManager.Domain.Enuns;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] CategoryType? type)
    {
        var categories = await _mediator.Send(new GetAllCategoriesQuery(GetUserId(), type));
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = await _mediator.Send(new CreateCategoryCommand(GetUserId(), request.Name, request.Type, request.Color));
        return Created($"/api/categories/{category.Id}", category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _mediator.Send(new UpdateCategoryCommand(GetUserId(), id, request.Name, request.Type, request.Color));
        if (category == null) return NotFound();
        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _mediator.Send(new DeleteCategoryCommand(GetUserId(), id));
            if (!deleted) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

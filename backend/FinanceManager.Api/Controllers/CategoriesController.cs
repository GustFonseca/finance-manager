using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;
using FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;
using FinanceManager.Domain.Enuns;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class CategoriesController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] CategoryType? type)
    {
        var categories = await Mediator.Send(new GetAllCategoriesQuery(UserId, type));
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = await Mediator.Send(new CreateCategoryCommand(UserId, request.Name, request.Type, request.Color));
        return Created($"/api/categories/{category.Id}", category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await Mediator.Send(new UpdateCategoryCommand(UserId, id, request.Name, request.Type, request.Color));
        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteCategoryCommand(UserId, id));
        return NoContent();
    }
}

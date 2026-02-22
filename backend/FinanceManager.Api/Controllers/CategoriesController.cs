using System.Security.Claims;
using FinanceManager.Api.Data;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] CategoryType? type)
    {
        var query = _db.Categories.Where(c => c.UserId == GetUserId());

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        var categories = await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Type = c.Type,
                Color = c.Color
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var category = new Category
        {
            UserId = GetUserId(),
            Name = request.Name,
            Type = request.Type,
            Color = request.Color
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Created($"/api/categories/{category.Id}", new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type,
            Color = category.Color
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == GetUserId());
        if (category == null) return NotFound();

        category.Name = request.Name;
        category.Type = request.Type;
        category.Color = request.Color;
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type,
            Color = category.Color
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == GetUserId());
        if (category == null) return NotFound();

        var hasTransactions = await _db.Transactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            return BadRequest(new { message = "Cannot delete category with existing transactions" });

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

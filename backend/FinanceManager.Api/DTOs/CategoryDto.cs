using FinanceManager.Api.Models;

namespace FinanceManager.Api.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string Color { get; set; } = "#888888";
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public string Color { get; set; } = "#888888";
}

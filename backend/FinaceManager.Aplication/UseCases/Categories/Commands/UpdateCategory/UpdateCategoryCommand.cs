using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(Guid UserId, Guid CategoryId, string Name, CategoryType Type, string Color) : ICommand<CategoryDto?>;

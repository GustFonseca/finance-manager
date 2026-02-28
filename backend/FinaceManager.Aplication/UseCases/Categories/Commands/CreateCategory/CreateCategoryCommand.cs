using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;

public record CreateCategoryCommand(Guid UserId, string Name, CategoryType Type, string Color) : ICommand<CategoryDto>;

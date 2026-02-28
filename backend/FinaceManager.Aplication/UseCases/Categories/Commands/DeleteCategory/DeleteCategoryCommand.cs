using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(Guid UserId, Guid CategoryId) : ICommand<bool>;

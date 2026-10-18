using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Commands.DismissInsight;

public record DismissInsightCommand(Guid UserId, string Key) : ICommand<bool>;

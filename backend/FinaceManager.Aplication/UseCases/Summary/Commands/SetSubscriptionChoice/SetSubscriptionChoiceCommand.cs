using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Summary.Commands.SetSubscriptionChoice;

public record SetSubscriptionChoiceCommand(Guid UserId, string Key, string Name, SubscriptionChoice? Choice, DateTime Now) : ICommand<bool>;

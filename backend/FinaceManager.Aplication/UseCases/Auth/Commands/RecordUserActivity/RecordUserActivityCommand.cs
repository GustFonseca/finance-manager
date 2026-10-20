using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Commands.RecordUserActivity;

public record RecordUserActivityCommand(Guid UserId, DateTime Now) : ICommand<bool>;

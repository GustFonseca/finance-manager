using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetWorkHours;

public record SetWorkHoursCommand(Guid UserId, int Hours) : ICommand<int>;

using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Debts.Commands.DeleteDebt;

public record DeleteDebtCommand(Guid UserId, Guid DebtId) : ICommand;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Debts.Commands.SaveDebt;

public record SaveDebtCommand(Guid UserId, Guid? DebtId, string Name, long BalanceCents, decimal MonthlyRatePercent, long MinimumPaymentCents) : ICommand<DebtDto>;

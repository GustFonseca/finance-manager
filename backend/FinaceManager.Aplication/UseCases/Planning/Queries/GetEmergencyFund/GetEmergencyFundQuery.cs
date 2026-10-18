using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetEmergencyFund;

public record GetEmergencyFundQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<EmergencyFundDto>;

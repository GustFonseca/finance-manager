using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;

public record SetMerchantClassCommand(Guid UserId, Guid MerchantId, SpendingClass? Class) : ICommand<MerchantDto>;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;

public record UpdateMerchantCommand(
    Guid UserId,
    Guid MerchantId,
    string Name,
    MerchantKind Kind,
    Guid? CategoryId,
    bool ApplyToTransactions) : ICommand<UpdateMerchantResultDto?>;

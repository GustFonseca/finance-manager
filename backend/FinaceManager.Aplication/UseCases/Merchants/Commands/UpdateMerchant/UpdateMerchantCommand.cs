using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;

/// <summary>Renames a merchant, sets its kind and category, optionally recategorizing its transactions. Null when not found.</summary>
public record UpdateMerchantCommand(
    Guid UserId,
    Guid MerchantId,
    string Name,
    MerchantKind Kind,
    Guid? CategoryId,
    bool ApplyToTransactions) : ICommand<UpdateMerchantResultDto?>;

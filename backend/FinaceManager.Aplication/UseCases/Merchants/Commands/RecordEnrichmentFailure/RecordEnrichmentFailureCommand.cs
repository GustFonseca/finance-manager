using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.RecordEnrichmentFailure;

public record RecordEnrichmentFailureCommand(Guid MerchantId, DateTime Now) : ICommand<bool>;

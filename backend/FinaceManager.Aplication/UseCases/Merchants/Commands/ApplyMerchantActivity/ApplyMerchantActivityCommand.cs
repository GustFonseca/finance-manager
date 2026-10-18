using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.ApplyMerchantActivity;

public record ApplyMerchantActivityCommand(Guid MerchantId, CompanyInfo? Company, DateTime Now) : ICommand<int>;

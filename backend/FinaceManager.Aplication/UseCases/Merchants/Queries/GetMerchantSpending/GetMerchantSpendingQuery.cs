using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;

public record GetMerchantSpendingQuery(Guid UserId, DateTime Start, DateTime End, Guid? AccountId) : IQuery<MerchantSpendingReportDto>;

using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;

/// <summary>How much went to each merchant in the period (a month or a year).</summary>
public record GetMerchantSpendingQuery(Guid UserId, DateTime Start, DateTime End, Guid? AccountId) : IQuery<MerchantSpendingReportDto>;

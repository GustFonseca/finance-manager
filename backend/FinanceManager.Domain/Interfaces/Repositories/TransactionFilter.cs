using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Interfaces.Repositories;

public record TransactionFilter(
    DateTime? Start = null,
    DateTime? End = null,
    Guid? AccountId = null,
    Guid? MerchantId = null,
    Guid? CategoryId = null,
    TransactionType? Type = null,
    string? Search = null,
    string? SearchKey = null,
    int? Limit = null);

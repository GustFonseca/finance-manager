using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;

/// <summary>
/// Files every transaction not yet under a merchant (those created before merchants
/// existed) and teaches each new merchant its most used category. Returns how many
/// transactions were filed.
/// </summary>
public record CatalogTransactionsCommand : ICommand<int>;

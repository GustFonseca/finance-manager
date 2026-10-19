using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;

public record CatalogTransactionsCommand(int Max = CatalogTransactionsCommand.DefaultMax) : ICommand<int>
{
    public const int DefaultMax = 5000;
}

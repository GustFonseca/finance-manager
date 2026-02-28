using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.DeleteAccount;

public record DeleteAccountCommand(Guid UserId, Guid AccountId) : ICommand<bool>;

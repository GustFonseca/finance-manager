
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;

public record UpdateAccountCommand(Guid UserId, Guid AccountId, string Name) : ICommand<AccountDto>;



using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;

public record UpdateAccountCommand(Guid userId, Guid accountId, string newName) : ICommand<AccountDto?>;


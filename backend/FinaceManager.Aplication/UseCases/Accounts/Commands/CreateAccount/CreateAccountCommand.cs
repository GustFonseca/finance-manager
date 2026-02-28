using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;

public record CreateAccountCommand(Guid userId, string name) : ICommand<AccountDto>;

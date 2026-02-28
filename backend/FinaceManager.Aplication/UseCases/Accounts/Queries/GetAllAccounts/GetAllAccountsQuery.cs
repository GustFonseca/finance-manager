using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;

public record GetAllAccountsQuery(Guid userId) : IQuery<List<AccountDto>>;


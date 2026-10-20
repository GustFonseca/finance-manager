using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Auth.Queries.GetUsersOverview;

public record GetUsersOverviewQuery(DateTime Now) : IQuery<List<UserOverviewDto>>;

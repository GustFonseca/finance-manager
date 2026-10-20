using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Auth.Queries.GetUsersOverview;

public class GetUsersOverviewHandler : IRequestHandler<GetUsersOverviewQuery, List<UserOverviewDto>>
{
    public const int ActiveDays = 7;

    private readonly IUserRepository _userRepository;

    public GetUsersOverviewHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserOverviewDto>> Handle(GetUsersOverviewQuery request, CancellationToken cancellationToken = default) =>
        (await _userRepository.GetActivitySummaryAsync())
            .Select(u => new UserOverviewDto
            {
                Id = u.Id,
                Name = string.IsNullOrWhiteSpace(u.Name) ? u.Email : u.Name,
                Email = u.Email,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                LastSeenAt = u.LastSeenAt,
                LoginCount = u.LoginCount,
                TransactionCount = u.TransactionCount,
                ActiveLast7Days = u.LastSeenAt is { } seen && request.Now - seen <= TimeSpan.FromDays(ActiveDays),
            })
            .ToList();
}

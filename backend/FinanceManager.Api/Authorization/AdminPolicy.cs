using System.Security.Claims;
using FinanceManager.Aplication.Auth;
using Microsoft.AspNetCore.Authorization;

namespace FinanceManager.Api.Authorization;

public static class AdminPolicy
{
    public const string Name = "admin";
}

public sealed class AdminRequirement : IAuthorizationRequirement;

public sealed class AdminRequirementHandler : AuthorizationHandler<AdminRequirement>
{
    private readonly IAdminDirectory _admins;

    public AdminRequirementHandler(IAdminDirectory admins)
    {
        _admins = admins;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AdminRequirement requirement)
    {
        if (_admins.IsAdmin(context.User.FindFirstValue(ClaimTypes.Email))) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

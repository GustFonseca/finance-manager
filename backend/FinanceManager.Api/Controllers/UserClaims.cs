using System.Security.Claims;

namespace FinanceManager.Api.Controllers;

public static class UserClaims
{
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("Sessão inválida. Entre novamente.");
}

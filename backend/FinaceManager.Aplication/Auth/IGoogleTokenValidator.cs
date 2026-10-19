namespace FinanceManager.Aplication.Auth;

public interface IGoogleTokenValidator
{
    Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}

public record GoogleIdentity(string Subject, string Email, string Name, bool EmailVerified, string? Nonce);

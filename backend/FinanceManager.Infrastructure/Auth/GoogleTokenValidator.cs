using FinanceManager.Aplication.Auth;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Infrastructure.Auth;

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _config;

    public GoogleTokenValidator(IConfiguration config)
    {
        _config = config;
    }

    public async Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [_config["Google:ClientId"]!]
        });
        return new GoogleIdentity(payload.Subject, payload.Email, payload.Name);
    }
}

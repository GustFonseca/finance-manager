using FinanceManager.Infrastructure.Auth;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace FinanceManager.Tests.Infrastructure;

public class GoogleTokenValidatorTests
{
    private static readonly IConfiguration Config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["Google:ClientId"] = "client-id" })
        .Build();

    [Theory]
    [InlineData("nao-e-um-jwt")]
    [InlineData("a.b")]
    public async Task A_malformed_token_is_rejected_as_an_invalid_jwt(string token)
    {
        await Assert.ThrowsAsync<InvalidJwtException>(() => new GoogleTokenValidator(Config).ValidateAsync(token));
    }
}

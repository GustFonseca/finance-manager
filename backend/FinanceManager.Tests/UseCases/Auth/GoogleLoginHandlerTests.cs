using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FinanceManager.Tests.UseCases.Auth;

public class GoogleLoginHandlerTests
{
    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly FakeGoogle _google = new();

    private readonly IConfiguration _config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "uma-chave-de-teste-com-mais-de-32-bytes!!",
            ["Jwt:Issuer"] = "finance-manager",
            ["Jwt:Audience"] = "finance-manager-web",
            ["Admin:Emails"] = "Ana@Gmail.com; chefe@x.com",
        })
        .Build();

    private GoogleLoginHandler Handler => new(
        new UserRepository(_db), new AccountRepository(_db), new CategoryRepository(_db), new ActivityLogRepository(_db), _google, _config,
        new FinanceManager.Infrastructure.Auth.ConfigAdminDirectory(_config));

    private ClaimsPrincipal Validate(string token) => new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
    {
        ValidIssuer = "finance-manager",
        ValidAudience = "finance-manager-web",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!)),
    }, out _);

    [Fact]
    public async Task A_first_login_creates_the_user_with_a_default_account_and_categories()
    {
        _google.Identity = new GoogleIdentity("google-1", "ana@gmail.com", "Ana");

        var response = await Handler.Handle(new GoogleLoginCommand("token-da-ana"));

        var user = Assert.Single(_db.Users);
        Assert.Equal(("google-1", "ana@gmail.com", "Ana"), (user.GoogleId, user.Email, user.Name));
        Assert.Equal("token-da-ana", _google.ReceivedToken);
        Assert.Equal("Conta Principal", Assert.Single(_db.Accounts).Name);
        Assert.Equal(3, _db.Categories.Count(c => c.UserId == user.Id && c.Type == CategoryType.INCOME));
        Assert.Equal(7, _db.Categories.Count(c => c.UserId == user.Id && c.Type == CategoryType.EXPENSE));
        Assert.Contains(_db.Categories, c => c.Name == "Outros");
        Assert.Contains(_db.ActivityLogs, a => a.UserId == user.Id && a.Source == "Sessão" && a.Description == "Entrou no sistema com a conta Google");
        Assert.Equal(("ana@gmail.com", "Ana", true), (response.Email, response.Name, response.IsAdmin));

        var principal = Validate(response.Token);
        Assert.Equal(user.Id.ToString(), principal.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("ana@gmail.com", principal.FindFirstValue(ClaimTypes.Email));
        Assert.Equal("Ana", principal.FindFirstValue(ClaimTypes.Name));
        Assert.True(new JwtSecurityTokenHandler().ReadJwtToken(response.Token).ValidTo > DateTime.UtcNow.AddDays(29));
    }

    [Fact]
    public async Task A_returning_user_is_not_seeded_again_and_falls_back_to_the_email_as_name()
    {
        var existing = new User { GoogleId = "google-2", Email = "bia@gmail.com", Name = "" };
        _db.Users.Add(existing);
        _db.SaveChanges();
        _google.Identity = new GoogleIdentity("google-2", "outro@gmail.com", "Outro nome");

        var response = await Handler.Handle(new GoogleLoginCommand("token"));

        Assert.Single(_db.Users);
        Assert.Empty(_db.Accounts);
        Assert.Empty(_db.Categories);
        Assert.Equal("bia@gmail.com", response.Email);
        Assert.Equal("bia@gmail.com", Validate(response.Token).FindFirstValue(ClaimTypes.Name));
        Assert.Single(_db.ActivityLogs, a => a.UserId == existing.Id && a.Source == "Sessão");
    }

    [Fact]
    public async Task An_invalid_google_token_stops_the_login()
    {
        _google.Error = new InvalidOperationException("token inválido");

        await Assert.ThrowsAsync<InvalidOperationException>(() => Handler.Handle(new GoogleLoginCommand("ruim")));

        Assert.Empty(_db.Users);
    }

    private sealed class FakeGoogle : IGoogleTokenValidator
    {
        public GoogleIdentity Identity { get; set; } = new("sub", "e@x.com", "E");
        public Exception? Error { get; set; }
        public string? ReceivedToken { get; private set; }

        public Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
        {
            ReceivedToken = idToken;
            return Error != null ? Task.FromException<GoogleIdentity>(Error) : Task.FromResult(Identity);
        }
    }
}

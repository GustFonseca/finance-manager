using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FinanceManager.Api.Data;
using FinanceManager.Api.Models;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FinanceManager.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(User user, string token)> AuthenticateWithGoogle(string idToken)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [_config["Google:ClientId"]!]
        });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
        if (user == null)
        {
            user = new User
            {
                Email = payload.Email,
                Name = payload.Name,
                GoogleId = payload.Subject
            };
            _db.Users.Add(user);
            await SeedUserData(user.Id);
            await _db.SaveChangesAsync();
        }

        var token = GenerateJwt(user);
        return (user, token);
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task SeedUserData(Guid userId)
    {
        _db.Accounts.Add(new Account
        {
            UserId = userId,
            Name = "Conta Principal",
            BalanceCents = 0
        });

        var categories = new (string name, CategoryType type, string color)[]
        {
            ("Salário", CategoryType.INCOME, "#4CAF50"),
            ("Freelance", CategoryType.INCOME, "#8BC34A"),
            ("Investimentos", CategoryType.INCOME, "#00BCD4"),
            ("Alimentação", CategoryType.EXPENSE, "#F44336"),
            ("Transporte", CategoryType.EXPENSE, "#FF9800"),
            ("Moradia", CategoryType.EXPENSE, "#9C27B0"),
            ("Saúde", CategoryType.EXPENSE, "#E91E63"),
            ("Educação", CategoryType.EXPENSE, "#3F51B5"),
            ("Lazer", CategoryType.EXPENSE, "#FF5722"),
            ("Outros", CategoryType.EXPENSE, "#607D8B")
        };

        foreach (var (name, type, color) in categories)
        {
            _db.Categories.Add(new Category
            {
                UserId = userId,
                Name = name,
                Type = type,
                Color = color
            });
        }

        await Task.CompletedTask;
    }
}

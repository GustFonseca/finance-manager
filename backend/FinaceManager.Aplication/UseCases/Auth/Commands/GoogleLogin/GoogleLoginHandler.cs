using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FinanceManager.Aplication.UseCases.Auth.Commands.GoogleLogin;

public class GoogleLoginHandler : IRequestHandler<GoogleLoginCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IConfiguration _config;

    public GoogleLoginHandler(
        IUserRepository userRepository,
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        IConfiguration config)
    {
        _userRepository = userRepository;
        _accountRepository = accountRepository;
        _categoryRepository = categoryRepository;
        _config = config;
    }

    public async Task<LoginResponse> Handle(GoogleLoginCommand request, CancellationToken cancellationToken = default)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [_config["Google:ClientId"]!]
        });

        var user = await _userRepository.GetByGoogleIdAsync(payload.Subject);
        if (user == null)
        {
            user = new User
            {
                Email = payload.Email,
                Name = payload.Name,
                GoogleId = payload.Subject
            };
            await _userRepository.CreateAsync(user);
            await SeedUserData(user.Id);
        }

        var token = GenerateJwt(user);

        return new LoginResponse
        {
            Token = token,
            Email = user.Email,
            Name = user.Name
        };
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
        await _accountRepository.CreateAsync(new Account(userId, "Conta Principal"));

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
            await _categoryRepository.CreateAsync(new Category
            {
                UserId = userId,
                Name = name,
                Type = type,
                Color = color
            });
        }
    }
}

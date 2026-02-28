namespace FinanceManager.Aplication.DTOs.Auth;

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

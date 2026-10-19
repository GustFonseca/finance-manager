namespace FinanceManager.Aplication.DTOs.Auth;

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
    public string? Nonce { get; set; }
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class ProfileDto
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public string? AvatarIcon { get; set; }
    public string? AvatarColor { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Occupation { get; set; }
    public long? MonthlyIncomeCents { get; set; }
    public int? Payday { get; set; }
    public int? Dependents { get; set; }
    public bool DigestByEmail { get; set; }
    public DateTime MemberSince { get; set; }
}

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? AvatarIcon { get; set; }
    public string? AvatarColor { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Occupation { get; set; }
    public long? MonthlyIncomeCents { get; set; }
    public int? Payday { get; set; }
    public int? Dependents { get; set; }
    public bool DigestByEmail { get; set; }
}

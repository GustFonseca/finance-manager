using FinanceManager.Aplication.Validation;
using System.Text.RegularExpressions;
using FinanceManager.Aplication.DTOs.Auth;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.UseCases.Profile;

public static partial class ProfileMapper
{
    public const int MaxDependents = 20;
    public static readonly DateTime MinBirthDate = new(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static readonly IReadOnlySet<string> States = new HashSet<string>
    {
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
        "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
    };

    public static NotFoundException UserNotFound() => new("Usuário não encontrado.");

    public static ProfileDto ToDto(User user, bool isAdmin) => new()
    {
        Email = user.Email,
        Name = string.IsNullOrWhiteSpace(user.Name) ? user.Email : user.Name,
        IsAdmin = isAdmin,
        AvatarIcon = user.AvatarIcon,
        AvatarColor = user.AvatarColor,
        BirthDate = user.BirthDate,
        Phone = user.Phone,
        City = user.City,
        State = user.State,
        Occupation = user.Occupation,
        MonthlyIncomeCents = user.MonthlyIncomeCents,
        Payday = user.Payday,
        Dependents = user.Dependents,
        DigestByEmail = user.DigestByEmail,
        MemberSince = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        LastSeenAt = user.LastSeenAt,
        LoginCount = user.LoginCount,
    };

    public static void Apply(User user, UpdateProfileRequest request, DateTime now)
    {
        var name = Input.Name(request.Name, emptyMessage: "Informe o seu nome.");

        var icon = Input.Optional(request.AvatarIcon);
        if (icon != null && !IconName().IsMatch(icon)) throw new BusinessRuleException("Ícone inválido.");
        var color = Input.Optional(request.AvatarColor);
        if (color != null && !HexColor().IsMatch(color)) throw new BusinessRuleException("Cor inválida.");

        if (request.BirthDate is { } birth && (birth < MinBirthDate || birth > now))
            throw new BusinessRuleException("Data de nascimento inválida.");

        var phone = Input.Optional(request.Phone);
        var digits = phone == null ? null : new string(phone.Where(char.IsDigit).ToArray());
        if (digits != null && (digits.Length < 10 || digits.Length > 13)) throw new BusinessRuleException("Telefone inválido. Use DDD + número.");

        var state = Input.Optional(request.State)?.ToUpperInvariant();
        if (state != null && !States.Contains(state)) throw new BusinessRuleException("Estado (UF) inválido.");

        var city = Input.Text(request.City, EntityLimits.TextLength, "A cidade");
        var occupation = Input.Text(request.Occupation, EntityLimits.TextLength, "A profissão");

        if (request.MonthlyIncomeCents is < 0) throw new BusinessRuleException("A renda não pode ser negativa.");
        if (request.Payday is < 1 or > 31) throw new BusinessRuleException("O dia do pagamento deve ficar entre 1 e 31.");
        if (request.Dependents is < 0 or > MaxDependents) throw new BusinessRuleException($"Os dependentes devem ficar entre 0 e {MaxDependents}.");

        user.Name = name;
        user.AvatarIcon = icon;
        user.AvatarColor = color?.ToUpperInvariant();
        user.BirthDate = request.BirthDate?.Date is { } date ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : null;
        user.Phone = digits;
        user.City = city;
        user.State = state;
        user.Occupation = occupation;
        user.MonthlyIncomeCents = request.MonthlyIncomeCents;
        user.Payday = request.Payday;
        user.Dependents = request.Dependents;
        user.DigestByEmail = request.DigestByEmail;
        user.ProfileUpdatedAt = now;
    }

    [GeneratedRegex("^[a-z0-9-]{1,40}$")]
    private static partial Regex IconName();

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();
}

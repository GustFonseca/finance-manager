namespace FinanceManager.Api.DTOs;

public class AccountDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long BalanceCents { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAccountRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateAccountRequest
{
    public string Name { get; set; } = string.Empty;
}

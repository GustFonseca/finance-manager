namespace FinanceManager.Aplication.Auth;

public interface IAdminDirectory
{
    bool IsAdmin(string? email);
}

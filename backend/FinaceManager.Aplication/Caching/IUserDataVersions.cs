namespace FinanceManager.Aplication.Caching;

public interface IUserDataVersions
{
    void Bump(Guid userId);
    void BumpAll();
}

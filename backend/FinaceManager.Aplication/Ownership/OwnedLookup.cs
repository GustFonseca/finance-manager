using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Common;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.Ownership;

public static class OwnedLookup
{
    public static async Task<T?> FindOwnedAsync<T>(this IRepository<T> repository, Guid id, Guid userId) where T : class, IOwned
    {
        var entity = await repository.GetByIdAsync(id);
        return entity?.UserId == userId ? entity : null;
    }

    public static async Task<T> GetOwnedAsync<T>(this IRepository<T> repository, Guid id, Guid userId) where T : class, IOwned =>
        await repository.FindOwnedAsync(id, userId) ?? throw NotFound<T>();

    public static async Task<T> GetLiveAsync<T>(this IRepository<T> repository, Guid id, Guid userId) where T : class, IOwned, ISoftDeletable =>
        await repository.FindOwnedAsync(id, userId) is { DeletedAt: null } entity ? entity : throw NotFound<T>();

    public static async Task<T> GetTrashedAsync<T>(this IRepository<T> repository, Guid id, Guid userId) where T : class, IOwned, ISoftDeletable =>
        await repository.FindOwnedAsync(id, userId) is { DeletedAt: not null } entity ? entity : throw NotFound<T>();

    public static NotFoundException NotFound<T>() => new(NameOf(typeof(T)));

    private static string NameOf(Type type) => type.Name switch
    {
        nameof(Account) => "Conta não encontrada.",
        nameof(Category) => "Categoria não encontrada.",
        nameof(Challenge) => "Desafio não encontrado.",
        nameof(Debt) => "Dívida não encontrada.",
        nameof(Folder) => "Pasta não encontrada.",
        nameof(Goal) => "Meta não encontrada.",
        nameof(Merchant) => "Estabelecimento não encontrado.",
        nameof(StoredFile) => "Arquivo não encontrado.",
        nameof(Transaction) => "Transação não encontrada.",
        nameof(WishlistItem) => "Item não encontrado.",
        _ => "Registro não encontrado.",
    };
}

using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Domain.Entities;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases;

public class OwnedLookupTests
{
    private readonly AppDbContext _db = TestDb.InMemory();

    [Fact]
    public async Task Only_the_owner_finds_an_item()
    {
        var me = _db.AddUser();
        var other = _db.AddUser("Outro");
        var account = _db.AddAccount(me.Id);
        var accounts = new AccountRepository(_db);

        Assert.Same(account, await accounts.FindOwnedAsync(account.Id, me.Id));
        Assert.Null(await accounts.FindOwnedAsync(account.Id, other.Id));
        Assert.Null(await accounts.FindOwnedAsync(Guid.NewGuid(), me.Id));
        Assert.Same(account, await accounts.GetOwnedAsync(account.Id, me.Id));
        var error = await Assert.ThrowsAsync<NotFoundException>(() => accounts.GetOwnedAsync(account.Id, other.Id));
        Assert.Equal("Conta não encontrada.", error.Message);
    }

    [Fact]
    public async Task Live_and_trashed_lookups_respect_the_trash()
    {
        var me = _db.AddUser();
        var live = new Folder { UserId = me.Id, Name = "Viva" };
        var trashed = new Folder { UserId = me.Id, Name = "Lixo", DeletedAt = DateTime.UtcNow };
        _db.Folders.AddRange(live, trashed);
        _db.SaveChanges();
        var folders = new FolderRepository(_db);

        Assert.Same(live, await folders.GetLiveAsync(live.Id, me.Id));
        Assert.Same(trashed, await folders.GetTrashedAsync(trashed.Id, me.Id));
        Assert.Equal("Pasta não encontrada.", (await Assert.ThrowsAsync<NotFoundException>(() => folders.GetLiveAsync(trashed.Id, me.Id))).Message);
        await Assert.ThrowsAsync<NotFoundException>(() => folders.GetTrashedAsync(live.Id, me.Id));
    }

    [Fact]
    public void Every_owned_item_has_its_own_not_found_message()
    {
        Assert.Equal(
            ["Conta não encontrada.", "Categoria não encontrada.", "Desafio não encontrado.", "Dívida não encontrada.", "Pasta não encontrada.",
             "Meta não encontrada.", "Estabelecimento não encontrado.", "Arquivo não encontrado.", "Transação não encontrada.", "Item não encontrado.",
             "Registro não encontrado."],
            [OwnedLookup.NotFound<Account>().Message, OwnedLookup.NotFound<Category>().Message, OwnedLookup.NotFound<Challenge>().Message,
             OwnedLookup.NotFound<Debt>().Message, OwnedLookup.NotFound<Folder>().Message, OwnedLookup.NotFound<Goal>().Message,
             OwnedLookup.NotFound<Merchant>().Message, OwnedLookup.NotFound<StoredFile>().Message, OwnedLookup.NotFound<Transaction>().Message,
             OwnedLookup.NotFound<WishlistItem>().Message, OwnedLookup.NotFound<SavingsPlan>().Message]);
    }
}

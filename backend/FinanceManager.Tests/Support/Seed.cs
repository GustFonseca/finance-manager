using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;

namespace FinanceManager.Tests.Support;

public static class Seed
{
    public static User AddUser(this AppDbContext db, string name = "Gustavo Fonseca")
    {
        var user = new User { Name = name, Email = $"{Guid.NewGuid():N}@test.com", GoogleId = Guid.NewGuid().ToString("N") };
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    public static Account AddAccount(this AppDbContext db, Guid userId, string name = "Nubank")
    {
        var account = new Account(userId, name);
        db.Accounts.Add(account);
        db.SaveChanges();
        return account;
    }

    public static Category AddCategory(this AppDbContext db, Guid userId, string name, CategoryType type = CategoryType.EXPENSE)
    {
        var category = new Category { UserId = userId, Name = name, Type = type, Color = "#123456" };
        db.Categories.Add(category);
        db.SaveChanges();
        return category;
    }

    public static Transaction AddTransaction(
        this AppDbContext db, Account account, Category category, long cents, DateTime date,
        string description = "Compra", Merchant? merchant = null)
    {
        var transaction = new Transaction
        {
            UserId = account.UserId,
            AccountId = account.Id,
            CategoryId = category.Id,
            Type = category.Type == CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE,
            AmountCents = cents,
            Description = description,
            Date = date,
            MerchantId = merchant?.Id,
        };
        db.Transactions.Add(transaction);
        db.SaveChanges();
        return transaction;
    }
}

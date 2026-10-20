using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;
using FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;

namespace FinanceManager.Tests.UseCases.Categories;

public class CategoryHandlersTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly AppDbContext _db = TestDb.InMemory();

    private CategoryRepository Categories => new(_db);

    [Fact]
    public async Task CreateCategory_saves_name_type_and_color()
    {
        var dto = await new CreateCategoryHandler(Categories)
            .Handle(new CreateCategoryCommand(Me, "Pets", CategoryType.EXPENSE, "#FF0000"));

        var saved = Assert.Single(_db.Categories);
        Assert.Equal(saved.Id, dto.Id);
        Assert.Equal(("Pets", CategoryType.EXPENSE, "#FF0000"), (dto.Name, dto.Type, dto.Color));
        Assert.Equal(Me, saved.UserId);
    }

    [Fact]
    public async Task GetAllCategories_lists_the_users_categories_sorted_and_filters_by_type()
    {
        _db.AddCategory(Me, "Salário", CategoryType.INCOME);
        _db.AddCategory(Me, "Moradia");
        _db.AddCategory(Me, "Alimentação");
        _db.AddCategory(SomeoneElse, "Lazer");
        var handler = new GetAllCategoriesHandler(Categories);

        var all = await handler.Handle(new GetAllCategoriesQuery(Me, null));
        var expenses = await handler.Handle(new GetAllCategoriesQuery(Me, CategoryType.EXPENSE));

        Assert.Equal(["Alimentação", "Moradia", "Salário"], all.Select(c => c.Name));
        Assert.Equal(["Alimentação", "Moradia"], expenses.Select(c => c.Name));
    }

    [Fact]
    public async Task UpdateCategory_changes_the_users_category()
    {
        var category = _db.AddCategory(Me, "Pets");

        var dto = await new UpdateCategoryHandler(Categories)
            .Handle(new UpdateCategoryCommand(Me, category.Id, "Bicos", CategoryType.INCOME, "#00FF00"));

        Assert.Equal(("Bicos", CategoryType.INCOME, "#00FF00"), (dto!.Name, dto.Type, dto.Color));
        Assert.Equal("Bicos", (await Categories.GetByIdAsync(category.Id))!.Name);
    }

    [Fact]
    public async Task UpdateCategory_returns_null_for_a_missing_or_foreign_category()
    {
        var foreign = _db.AddCategory(SomeoneElse, "Lazer");
        var handler = new UpdateCategoryHandler(Categories);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateCategoryCommand(Me, Guid.NewGuid(), "x", CategoryType.EXPENSE, "#000")));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UpdateCategoryCommand(Me, foreign.Id, "x", CategoryType.EXPENSE, "#000")));
        Assert.Equal("Lazer", foreign.Name);
    }

    [Fact]
    public async Task DeleteCategory_removes_an_unused_category()
    {
        var category = _db.AddCategory(Me, "Pets");

        await new DeleteCategoryHandler(Categories, new TransactionRepository(_db)).Handle(new DeleteCategoryCommand(Me, category.Id));

        Assert.Empty(_db.Categories);
    }

    [Fact]
    public async Task DeleteCategory_returns_false_for_a_missing_or_foreign_category()
    {
        var foreign = _db.AddCategory(SomeoneElse, "Lazer");
        var handler = new DeleteCategoryHandler(Categories, new TransactionRepository(_db));

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteCategoryCommand(Me, Guid.NewGuid())));
        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new DeleteCategoryCommand(Me, foreign.Id)));
        Assert.Single(_db.Categories);
    }

    [Fact]
    public async Task DeleteCategory_refuses_a_category_that_has_transactions()
    {
        var category = _db.AddCategory(Me, "Lazer");
        _db.AddTransaction(_db.AddAccount(Me), category, 1000, DateTime.UtcNow);

        var error = await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new DeleteCategoryHandler(Categories, new TransactionRepository(_db)).Handle(new DeleteCategoryCommand(Me, category.Id)));

        Assert.StartsWith("Não é possível excluir uma categoria que tem transações.", error.Message);
        Assert.Single(_db.Categories);
    }
}

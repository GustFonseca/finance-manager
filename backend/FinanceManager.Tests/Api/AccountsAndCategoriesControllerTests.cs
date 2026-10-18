using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.DeleteAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;
using FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;
using FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;
using FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;
using FinanceManager.Domain.Enuns;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.Api;

public class AccountsAndCategoriesControllerTests
{
    private static readonly Guid Me = Guid.NewGuid();

    private readonly FakeMediator _mediator = new();

    private AccountsController Accounts => new AccountsController(_mediator).SignedIn(Me);
    private CategoriesController Categories => new CategoriesController(_mediator).SignedIn(Me);

    [Fact]
    public async Task Accounts_GetAll_returns_the_signed_in_users_accounts()
    {
        var accounts = new List<AccountDto> { new() { Name = "Nubank" } };
        _mediator.Returns<GetAllAccountsQuery>(_ => accounts);

        var result = await Accounts.GetAll();

        Assert.Same(accounts, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetAllAccountsQuery(Me), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Accounts_Create_returns_201_with_the_location()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<CreateAccountCommand>(c => new AccountDto { Id = id, Name = c.name });

        var result = await Accounts.Create(new CreateAccountRequest { Name = "Nubank" });

        var created = Assert.IsType<CreatedResult>(result.Result);
        Assert.Equal($"/api/accounts/{id}", created.Location);
        Assert.Equal("Nubank", Assert.IsType<AccountDto>(created.Value).Name);
        Assert.Equal(new CreateAccountCommand(Me, "Nubank"), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Accounts_Update_returns_200_or_404()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<UpdateAccountCommand>(c => c.accountId == id ? new AccountDto { Id = id, Name = c.newName } : null);

        var found = await Accounts.Update(id, new UpdateAccountRequest { Name = "Novo" });
        var missing = await Accounts.Update(Guid.NewGuid(), new UpdateAccountRequest { Name = "Novo" });

        Assert.Equal("Novo", Assert.IsType<AccountDto>(Assert.IsType<OkObjectResult>(found.Result).Value).Name);
        Assert.IsType<NotFoundResult>(missing.Result);
    }

    [Fact]
    public async Task Accounts_Delete_returns_204_or_404()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<DeleteAccountCommand>(c => c.AccountId == id);

        Assert.IsType<NoContentResult>(await Accounts.Delete(id));
        Assert.IsType<NotFoundResult>(await Accounts.Delete(Guid.NewGuid()));
        Assert.All(_mediator.Sent, s => Assert.Equal(Me, ((DeleteAccountCommand)s).UserId));
    }

    [Fact]
    public async Task A_request_without_a_valid_user_claim_is_unauthorized()
    {
        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => new AccountsController(_mediator).Anonymous().GetAll());

        Assert.Equal("Sessão inválida. Entre novamente.", error.Message);
        Assert.Empty(_mediator.Sent);
    }

    [Fact]
    public async Task Categories_GetAll_passes_the_type_filter()
    {
        var categories = new List<CategoryDto>();
        _mediator.Returns<GetAllCategoriesQuery>(_ => categories);

        var result = await Categories.GetAll(CategoryType.INCOME);

        Assert.Same(categories, Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(new GetAllCategoriesQuery(Me, CategoryType.INCOME), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Categories_Create_returns_201_with_the_location()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<CreateCategoryCommand>(c => new CategoryDto { Id = id, Name = c.Name, Type = c.Type, Color = c.Color });

        var result = await Categories.Create(new CreateCategoryRequest { Name = "Pets", Type = CategoryType.EXPENSE, Color = "#111" });

        var created = Assert.IsType<CreatedResult>(result.Result);
        Assert.Equal($"/api/categories/{id}", created.Location);
        Assert.Equal(new CreateCategoryCommand(Me, "Pets", CategoryType.EXPENSE, "#111"), Assert.Single(_mediator.Sent));
    }

    [Fact]
    public async Task Categories_Update_returns_200_or_404()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<UpdateCategoryCommand>(c => c.CategoryId == id ? new CategoryDto { Id = id, Name = c.Name } : null);
        var request = new UpdateCategoryRequest { Name = "Bicos", Type = CategoryType.INCOME, Color = "#222" };

        var found = await Categories.Update(id, request);
        var missing = await Categories.Update(Guid.NewGuid(), request);

        Assert.Equal("Bicos", Assert.IsType<CategoryDto>(Assert.IsType<OkObjectResult>(found.Result).Value).Name);
        Assert.IsType<NotFoundResult>(missing.Result);
        Assert.Equal(new UpdateCategoryCommand(Me, id, "Bicos", CategoryType.INCOME, "#222"), _mediator.Sent[0]);
    }

    [Fact]
    public async Task Categories_Delete_returns_204_or_404()
    {
        var id = Guid.NewGuid();
        _mediator.Returns<DeleteCategoryCommand>(c => c.CategoryId == id);

        Assert.IsType<NoContentResult>(await Categories.Delete(id));
        Assert.IsType<NotFoundResult>(await Categories.Delete(Guid.NewGuid()));
    }
}

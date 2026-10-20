using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.DeleteAccount;
using FinanceManager.Aplication.UseCases.Accounts.Commands.UpdateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class AccountsController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll()
    {
        var accounts = await Mediator.Send(new GetAllAccountsQuery(UserId));
        return Ok(accounts);
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountRequest request)
    {
        var account = await Mediator.Send(new CreateAccountCommand(UserId, request.Name));
        return Created($"/api/accounts/{account.Id}", account);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccountDto>> Update(Guid id, [FromBody] UpdateAccountRequest request)
    {
        var account = await Mediator.Send(new UpdateAccountCommand(UserId, id, request.Name));
        return Ok(account);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteAccountCommand(UserId, id));
        return NoContent();
    }
}

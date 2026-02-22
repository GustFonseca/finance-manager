using System.Security.Claims;
using FinanceManager.Api.Data;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountsController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll()
    {
        var accounts = await _db.Accounts
            .Where(a => a.UserId == GetUserId())
            .OrderBy(a => a.Name)
            .Select(a => new AccountDto
            {
                Id = a.Id,
                Name = a.Name,
                BalanceCents = a.BalanceCents,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(accounts);
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountRequest request)
    {
        var account = new Account
        {
            UserId = GetUserId(),
            Name = request.Name
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return Created($"/api/accounts/{account.Id}", new AccountDto
        {
            Id = account.Id,
            Name = account.Name,
            BalanceCents = account.BalanceCents,
            CreatedAt = account.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccountDto>> Update(Guid id, [FromBody] UpdateAccountRequest request)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == GetUserId());
        if (account == null) return NotFound();

        account.Name = request.Name;
        await _db.SaveChangesAsync();

        return Ok(new AccountDto
        {
            Id = account.Id,
            Name = account.Name,
            BalanceCents = account.BalanceCents,
            CreatedAt = account.CreatedAt
        });
    }
}

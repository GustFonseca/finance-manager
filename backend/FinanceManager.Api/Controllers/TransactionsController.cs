using System.Security.Claims;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly TransactionService _transactionService;

    public TransactionsController(TransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end)
    {
        var transactions = await _transactionService.GetByDateRange(GetUserId(), start, end);

        var dtos = transactions.Select(t => new TransactionDto
        {
            Id = t.Id,
            AccountId = t.AccountId,
            AccountName = t.Account.Name,
            CategoryId = t.CategoryId,
            CategoryName = t.Category.Name,
            Type = t.Type,
            AmountCents = t.AmountCents,
            Description = t.Description,
            Date = t.Date,
            Recurrence = t.Recurrence
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionRequest request)
    {
        try
        {
            var transaction = await _transactionService.Add(GetUserId(), request);
            return Created($"/api/transactions/{transaction.Id}", new TransactionDto
            {
                Id = transaction.Id,
                AccountId = transaction.AccountId,
                CategoryId = transaction.CategoryId,
                Type = transaction.Type,
                AmountCents = transaction.AmountCents,
                Description = transaction.Description,
                Date = transaction.Date,
                Recurrence = transaction.Recurrence
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _transactionService.Remove(GetUserId(), id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Transactions.Commands.SetReceipt;
using FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;
using FinanceManager.Aplication.UseCases.Transactions.Commands.UpdateTransaction;
using FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;
using FinanceManager.Domain.Enuns;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class TransactionsController : ControllerBase
{
    public const int MaxLimit = 500;

    private readonly IMediator _mediator;

    public TransactionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId,
        [FromQuery] Guid? merchantId,
        [FromQuery] Guid? categoryId,
        [FromQuery] TransactionType? type,
        [FromQuery] string? search,
        [FromQuery] int? limit)
    {
        if (limit is < 1 or > MaxLimit) return BadRequest(new { message = $"O limite deve ficar entre 1 e {MaxLimit}" });
        var transactions = await _mediator.Send(new GetTransactionsByDateRangeQuery(
            GetUserId(), start?.ToUniversalTime(), end?.ToUniversalTime(), accountId, merchantId, categoryId, type, search, limit));
        return Ok(transactions);
    }

    [HttpPut("{id}/receipt")]
    public async Task<ActionResult<TransactionDto>> SetReceipt(Guid id, [FromBody] ReceiptRequest request)
    {
        var transaction = await _mediator.Send(new SetReceiptCommand(GetUserId(), id, request.FileId));
        if (transaction == null) return NotFound();
        return Ok(transaction);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionRequest request)
    {
        var transaction = await _mediator.Send(new CreateTransactionCommand(
            GetUserId(),
            request.AccountId,
            request.CategoryId,
            request.Type,
            request.AmountCents,
            request.Description,
            request.Date,
            request.Recurrence));
        return Created($"/api/transactions/{transaction.Id}", transaction);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionDto>> Update(Guid id, [FromBody] CreateTransactionRequest request)
    {
        var transaction = await _mediator.Send(new UpdateTransactionCommand(
            GetUserId(), id, request.AccountId, request.CategoryId, request.Type,
            request.AmountCents, request.Description, request.Date, request.Recurrence));
        return Ok(transaction);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteTransactionCommand(GetUserId(), id));
        return NoContent();
    }

    [HttpPost("import")]
    public async Task<ActionResult<object>> Import([FromBody] ImportTransactionsRequest request)
    {
        var imported = await _mediator.Send(new ImportTransactionsCommand(GetUserId(), request.AccountId, request.Lines));
        return Ok(new { imported });
    }

    [HttpDelete]
    public async Task<ActionResult<object>> DeleteAll()
    {
        var deleted = await _mediator.Send(new DeleteAllTransactionsCommand(GetUserId()));
        return Ok(new { deleted });
    }
}

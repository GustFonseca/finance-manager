using System.Security.Claims;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using FinanceManager.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/merchants")]
[Authorize]
public class MerchantsController : ControllerBase
{
    /// <summary>Lines in one statement are well under this.</summary>
    private const int MaxDescriptions = 2000;

    private readonly IMediator _mediator;

    public MerchantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<MerchantDto>>> GetAll()
    {
        return Ok(await _mediator.Send(new GetMerchantsQuery(GetUserId())));
    }

    /// <summary>The merchant of each description being imported, with the category it was filed under before.</summary>
    [HttpPost("resolve")]
    public async Task<ActionResult<List<MerchantMatchDto>>> Resolve([FromBody] ResolveMerchantsRequest request)
    {
        if (request.Descriptions.Count > MaxDescriptions)
            return BadRequest(new { message = $"No máximo {MaxDescriptions} descrições por vez" });
        return Ok(await _mediator.Send(new ResolveMerchantsQuery(GetUserId(), request.Descriptions)));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UpdateMerchantResultDto>> Update(Guid id, [FromBody] UpdateMerchantRequest request)
    {
        try
        {
            var result = await _mediator.Send(new UpdateMerchantCommand(
                GetUserId(), id, request.Name, request.Kind, request.CategoryId, request.ApplyToTransactions));
            return result == null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Spending per merchant in the period (a month or a year).</summary>
    [HttpGet("spending")]
    public async Task<ActionResult<MerchantSpendingReportDto>> GetSpending(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetMerchantSpendingQuery(GetUserId(), periodStart, periodEnd, accountId)));
    }

    /// <summary>One merchant month by month.</summary>
    [HttpGet("{id}/history")]
    public async Task<ActionResult<MerchantHistoryDto>> GetHistory(Guid id, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        var history = await _mediator.Send(new GetMerchantHistoryQuery(GetUserId(), id, periodStart, periodEnd));
        return history == null ? NotFound() : Ok(history);
    }
}

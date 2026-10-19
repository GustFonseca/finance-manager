using Microsoft.AspNetCore.RateLimiting;
using FinanceManager.Api.Security;
using System.Security.Claims;
using FinanceManager.Api.Models;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Merchants.Queries.LookupCompany;
using FinanceManager.Aplication.UseCases.Merchants.Commands.SetMerchantClass;
using FinanceManager.Aplication.UseCases.Merchants.Commands.UpdateMerchant;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetUnsortedMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchants;
using FinanceManager.Aplication.UseCases.Merchants.Queries.ResolveMerchants;
using Microsoft.AspNetCore.Authorization;
using FinanceManager.Api.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/merchants")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class MerchantsController : ControllerBase
{
    private const int MaxDescriptions = 2000;

    private readonly IMediator _mediator;

    public MerchantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<MerchantDto>>> GetAll()
    {
        return Ok(await _mediator.Send(new GetMerchantsQuery(GetUserId())));
    }

    [HttpPost("resolve")]
    [EnableRateLimiting(RateLimits.Lookup)]
    public async Task<ActionResult<List<MerchantMatchDto>>> Resolve([FromBody] ResolveMerchantsRequest request)
    {
        if (request.Lines.Count > MaxDescriptions)
            return BadRequest(new { message = $"No máximo {MaxDescriptions} linhas por vez" });
        return Ok(await _mediator.Send(new ResolveMerchantsQuery(GetUserId(), request.Lines)));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UpdateMerchantResultDto>> Update(Guid id, [FromBody] UpdateMerchantRequest request)
    {
        var result = await _mediator.Send(new UpdateMerchantCommand(
            GetUserId(), id, request.Name, request.Kind, request.CategoryId, request.ApplyToTransactions));
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut("{id}/class")]
    public async Task<ActionResult<MerchantDto>> SetClass(Guid id, [FromBody] SetMerchantClassRequest request)
    {
        var merchant = await _mediator.Send(new SetMerchantClassCommand(GetUserId(), id, request.Class));
        return merchant == null ? NotFound() : Ok(merchant);
    }

    [HttpGet("company/{cnpj}")]
    [EnableRateLimiting(RateLimits.Lookup)]
    public async Task<ActionResult<CompanyDto>> LookupCompany(string cnpj)
    {
        var company = await _mediator.Send(new LookupCompanyQuery(cnpj));
        if (company == null) return NotFound(new { message = "Empresa não encontrada" });
        return Ok(company);
    }

    [HttpGet("spending")]
    public async Task<ActionResult<MerchantSpendingReportDto>> GetSpending(
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end,
        [FromQuery] Guid? accountId)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetMerchantSpendingQuery(GetUserId(), periodStart, periodEnd, accountId)));
    }

    [HttpGet("unsorted")]
    public async Task<ActionResult<List<MerchantSpendingDto>>> GetUnsorted([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        return Ok(await _mediator.Send(new GetUnsortedMerchantsQuery(GetUserId(), periodStart, periodEnd)));
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<MerchantHistoryDto>> GetHistory(Guid id, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        var history = await _mediator.Send(new GetMerchantHistoryQuery(GetUserId(), id, periodStart, periodEnd));
        return history == null ? NotFound() : Ok(history);
    }
}

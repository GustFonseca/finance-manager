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
public class MerchantsController(IMediator mediator) : AppController(mediator)
{
    private const int MaxDescriptions = 2000;



    [HttpGet]
    public async Task<ActionResult<List<MerchantDto>>> GetAll()
    {
        return Ok(await Mediator.Send(new GetMerchantsQuery(UserId)));
    }

    [HttpPost("resolve")]
    [EnableRateLimiting(RateLimits.Lookup)]
    public async Task<ActionResult<List<MerchantMatchDto>>> Resolve([FromBody] ResolveMerchantsRequest request)
    {
        if (request.Lines.Count > MaxDescriptions)
            return BadRequest(new { message = $"No máximo {MaxDescriptions} linhas por vez" });
        return Ok(await Mediator.Send(new ResolveMerchantsQuery(UserId, request.Lines)));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UpdateMerchantResultDto>> Update(Guid id, [FromBody] UpdateMerchantRequest request)
    {
        var result = await Mediator.Send(new UpdateMerchantCommand(
            UserId, id, request.Name, request.Kind, request.CategoryId, request.ApplyToTransactions));
        return Ok(result);
    }

    [HttpPut("{id}/class")]
    public async Task<ActionResult<MerchantDto>> SetClass(Guid id, [FromBody] SetMerchantClassRequest request)
    {
        var merchant = await Mediator.Send(new SetMerchantClassCommand(UserId, id, request.Class));
        return Ok(merchant);
    }

    [HttpGet("company/{cnpj}")]
    [EnableRateLimiting(RateLimits.Lookup)]
    public async Task<ActionResult<CompanyDto>> LookupCompany(string cnpj)
    {
        var company = await Mediator.Send(new LookupCompanyQuery(cnpj));
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
        return Ok(await Mediator.Send(new GetMerchantSpendingQuery(UserId, periodStart, periodEnd, accountId)));
    }

    [HttpGet("unsorted")]
    public async Task<ActionResult<List<MerchantSpendingDto>>> GetUnsorted([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        return Ok(await Mediator.Send(new GetUnsortedMerchantsQuery(UserId, periodStart, periodEnd)));
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<MerchantHistoryDto>> GetHistory(Guid id, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var (periodStart, periodEnd) = MonthPeriod.Resolve(start, end);
        var history = await Mediator.Send(new GetMerchantHistoryQuery(UserId, id, periodStart, periodEnd));
        return Ok(history);
    }
}

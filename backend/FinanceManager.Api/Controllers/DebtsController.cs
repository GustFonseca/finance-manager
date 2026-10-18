using System.Security.Claims;
using FinanceManager.Api.Caching;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Debts.Commands.DeleteDebt;
using FinanceManager.Aplication.UseCases.Debts.Commands.SaveDebt;
using FinanceManager.Aplication.UseCases.Debts.Queries.GetDebtPlan;
using FinanceManager.Aplication.UseCases.Debts.Queries.GetDebts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/debts")]
[Authorize]
[OutputCache(PolicyName = UserDataCachePolicy.Name)]
public class DebtsController : ControllerBase
{
    private readonly IMediator _mediator;

    public DebtsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<DebtDto>>> GetAll() => Ok(await _mediator.Send(new GetDebtsQuery(GetUserId())));

    [HttpGet("plan")]
    public async Task<ActionResult<DebtPlanDto>> Plan([FromQuery] long? extraCents) =>
        Ok(await _mediator.Send(new GetDebtPlanQuery(GetUserId(), extraCents ?? 0)));

    [HttpPost]
    public async Task<ActionResult<DebtDto>> Create([FromBody] SaveDebtRequest request)
    {
        var debt = await _mediator.Send(new SaveDebtCommand(GetUserId(), null, request.Name, request.BalanceCents, request.MonthlyRatePercent, request.MinimumPaymentCents));
        return Created($"/api/debts/{debt!.Id}", debt);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DebtDto>> Update(Guid id, [FromBody] SaveDebtRequest request)
    {
        var debt = await _mediator.Send(new SaveDebtCommand(GetUserId(), id, request.Name, request.BalanceCents, request.MonthlyRatePercent, request.MinimumPaymentCents));
        if (debt == null) return NotFound();
        return Ok(debt);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await _mediator.Send(new DeleteDebtCommand(GetUserId(), id))) return NotFound();
        return NoContent();
    }
}

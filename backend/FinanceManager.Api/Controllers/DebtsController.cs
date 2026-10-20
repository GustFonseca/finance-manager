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
public class DebtsController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<DebtDto>>> GetAll() => Ok(await Mediator.Send(new GetDebtsQuery(UserId)));

    [HttpGet("plan")]
    public async Task<ActionResult<DebtPlanDto>> Plan([FromQuery] long? extraCents) =>
        Ok(await Mediator.Send(new GetDebtPlanQuery(UserId, extraCents ?? 0)));

    [HttpPost]
    public async Task<ActionResult<DebtDto>> Create([FromBody] SaveDebtRequest request)
    {
        var debt = await Mediator.Send(new SaveDebtCommand(UserId, null, request.Name, request.BalanceCents, request.MonthlyRatePercent, request.MinimumPaymentCents));
        return Created($"/api/debts/{debt.Id}", debt);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DebtDto>> Update(Guid id, [FromBody] SaveDebtRequest request)
    {
        var debt = await Mediator.Send(new SaveDebtCommand(UserId, id, request.Name, request.BalanceCents, request.MonthlyRatePercent, request.MinimumPaymentCents));
        return Ok(debt);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await Mediator.Send(new DeleteDebtCommand(UserId, id));
        return NoContent();
    }
}

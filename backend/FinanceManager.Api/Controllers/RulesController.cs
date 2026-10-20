using Microsoft.AspNetCore.RateLimiting;
using FinanceManager.Api.Security;
using System.Security.Claims;
using FinanceManager.Api.Authorization;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;
using FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Aplication.UseCases.Rules.Queries.TestRule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/rules")]
[Authorize(Policy = AdminPolicy.Name)]
public class RulesController(IMediator mediator) : AppController(mediator)
{
    [HttpGet]
    public async Task<ActionResult<List<RuleDto>>> GetAll() => Ok(await Mediator.Send(new GetRulesQuery()));

    [HttpPost]
    public async Task<ActionResult<RuleDto>> Create([FromBody] SaveRuleRequest request)
    {
        var rule = await Mediator.Send(new SaveRuleCommand(UserId, null, request.Type, request.Pattern, request.Value, request.Priority, request.Note));
        return Created($"/api/rules/{rule.Id}", rule);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RuleDto>> Update(Guid id, [FromBody] SaveRuleRequest request)
    {
        var rule = await Mediator.Send(new SaveRuleCommand(UserId, id, request.Type, request.Pattern, request.Value, request.Priority, request.Note));
        return Ok(rule);
    }

    [HttpPut("{id}/active")]
    public async Task<ActionResult<RuleDto>> SetActive(Guid id, [FromBody] RuleActiveRequest request)
    {
        var rule = await Mediator.Send(new SetRuleActiveCommand(UserId, id, request.IsActive));
        return Ok(rule);
    }

    [HttpPost("test")]
    [EnableRateLimiting(RateLimits.Lookup)]
    public async Task<ActionResult<RuleTestDto>> Test([FromBody] RuleTestRequest request) =>
        Ok(await Mediator.Send(new TestRuleQuery(UserId, request.Pattern, DateTime.UtcNow)));
}

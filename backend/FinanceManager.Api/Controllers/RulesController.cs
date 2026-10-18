using System.Security.Claims;
using FinanceManager.Api.Authorization;
using FinanceManager.Api.Caching;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;
using FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Aplication.UseCases.Rules.Queries.TestRule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace FinanceManager.Api.Controllers;

[ApiController]
[Route("api/rules")]
[Authorize(Policy = AdminPolicy.Name)]
public class RulesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IOutputCacheStore _cache;

    public RulesController(IMediator mediator, IOutputCacheStore cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    private Guid GetUserId() => User.GetUserId();

    [HttpGet]
    public async Task<ActionResult<List<RuleDto>>> GetAll() => Ok(await _mediator.Send(new GetRulesQuery()));

    [HttpPost]
    public async Task<ActionResult<RuleDto>> Create([FromBody] SaveRuleRequest request)
    {
        var rule = await _mediator.Send(new SaveRuleCommand(GetUserId(), null, request.Type, request.Pattern, request.Value, request.Priority, request.Note));
        await _cache.EvictByTagAsync(UserDataCachePolicy.AllTag, HttpContext.RequestAborted);
        return Created($"/api/rules/{rule!.Id}", rule);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RuleDto>> Update(Guid id, [FromBody] SaveRuleRequest request)
    {
        var rule = await _mediator.Send(new SaveRuleCommand(GetUserId(), id, request.Type, request.Pattern, request.Value, request.Priority, request.Note));
        if (rule == null) return NotFound();
        await _cache.EvictByTagAsync(UserDataCachePolicy.AllTag, HttpContext.RequestAborted);
        return Ok(rule);
    }

    [HttpPut("{id}/active")]
    public async Task<ActionResult<RuleDto>> SetActive(Guid id, [FromBody] RuleActiveRequest request)
    {
        var rule = await _mediator.Send(new SetRuleActiveCommand(GetUserId(), id, request.IsActive));
        if (rule == null) return NotFound();
        await _cache.EvictByTagAsync(UserDataCachePolicy.AllTag, HttpContext.RequestAborted);
        return Ok(rule);
    }

    [HttpPost("test")]
    public async Task<ActionResult<RuleTestDto>> Test([FromBody] RuleTestRequest request) =>
        Ok(await _mediator.Send(new TestRuleQuery(GetUserId(), request.Pattern, DateTime.UtcNow)));
}

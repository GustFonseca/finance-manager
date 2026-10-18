using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;

public class GetRulesHandler : IRequestHandler<GetRulesQuery, List<RuleDto>>
{
    private readonly IClassificationRuleRepository _ruleRepository;

    public GetRulesHandler(IClassificationRuleRepository ruleRepository)
    {
        _ruleRepository = ruleRepository;
    }

    public async Task<List<RuleDto>> Handle(GetRulesQuery request, CancellationToken cancellationToken = default) =>
        (await _ruleRepository.GetAllAsync()).Select(ToDto).ToList();

    public static RuleDto ToDto(ClassificationRule rule) => new()
    {
        Id = rule.Id,
        Type = rule.Type,
        Pattern = rule.Pattern,
        Value = rule.Value,
        Priority = rule.Priority,
        IsActive = rule.IsActive,
        Note = rule.Note,
        IsDefault = RuleCatalog.IsDefault(rule),
    };
}

using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;

public class SetRuleActiveHandler : IRequestHandler<SetRuleActiveCommand, RuleDto>
{
    private readonly IClassificationRuleRepository _ruleRepository;
    private readonly IActivityLogRepository _activityLogRepository;

    public SetRuleActiveHandler(IClassificationRuleRepository ruleRepository, IActivityLogRepository activityLogRepository)
    {
        _ruleRepository = ruleRepository;
        _activityLogRepository = activityLogRepository;
    }

    public async Task<RuleDto> Handle(SetRuleActiveCommand request, CancellationToken cancellationToken = default)
    {
        var rule = await _ruleRepository.GetByIdAsync(request.RuleId) ?? throw RuleCatalog.NotFound();
        if (rule.SetActive(request.IsActive))
        {
            await _ruleRepository.UpdateAsync(rule);
            await _activityLogRepository.CreateAsync(new ActivityLog
            {
                UserId = request.UserId,
                Source = "Regras",
                Description = SaveRuleHandler.Truncate($"Regra {(rule.IsActive ? "ativada" : "desativada")}: {rule.Type} \"{rule.Pattern}\""),
            });
        }
        return GetRulesHandler.ToDto(rule);
    }
}

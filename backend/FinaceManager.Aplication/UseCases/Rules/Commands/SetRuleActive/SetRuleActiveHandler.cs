using FinanceManager.Aplication.Caching;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;

public class SetRuleActiveHandler : IRequestHandler<SetRuleActiveCommand, RuleDto?>
{
    private readonly IClassificationRuleRepository _ruleRepository;
    private readonly IActivityLogRepository _activityLogRepository;
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserDataVersions _versions;

    public SetRuleActiveHandler(
        IClassificationRuleRepository ruleRepository,
        IActivityLogRepository activityLogRepository,
        IClassificationRulesProvider rulesProvider,
        IUnitOfWork unitOfWork,
        IUserDataVersions versions)
    {
        _unitOfWork = unitOfWork;
        _versions = versions;
        _ruleRepository = ruleRepository;
        _activityLogRepository = activityLogRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<RuleDto?> Handle(SetRuleActiveCommand request, CancellationToken cancellationToken = default)
    {
        var rule = await _ruleRepository.GetByIdAsync(request.RuleId);
        if (rule == null) return null;
        if (rule.IsActive != request.IsActive)
        {
            rule.IsActive = request.IsActive;
            await _ruleRepository.UpdateAsync(rule);
            await _activityLogRepository.CreateAsync(new ActivityLog
            {
                UserId = request.UserId,
                Source = "Regras",
                Description = SaveRuleHandler.Truncate($"Regra {(rule.IsActive ? "ativada" : "desativada")}: {rule.Type} \"{rule.Pattern}\""),
            });
            RulesChanged.AfterCommit(_unitOfWork, _rulesProvider, _versions);
        }
        return GetRulesHandler.ToDto(rule);
    }
}

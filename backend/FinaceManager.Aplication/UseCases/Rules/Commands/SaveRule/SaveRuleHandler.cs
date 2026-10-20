using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;

public class SaveRuleHandler : IRequestHandler<SaveRuleCommand, RuleDto>
{
    private readonly IClassificationRuleRepository _ruleRepository;
    private readonly IActivityLogRepository _activityLogRepository;

    public SaveRuleHandler(IClassificationRuleRepository ruleRepository, IActivityLogRepository activityLogRepository)
    {
        _ruleRepository = ruleRepository;
        _activityLogRepository = activityLogRepository;
    }

    public async Task<RuleDto> Handle(SaveRuleCommand request, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(request.Type)) throw new BusinessRuleException("Tipo de regra inválido.");
        var pattern = request.Pattern?.Trim() ?? string.Empty;
        var problem = RuleCatalog.PatternError(pattern);
        if (problem != null) throw new BusinessRuleException(problem);
        var value = Input.Text(request.Value, EntityLimits.RuleValueLength, "O valor");
        if (RuleCatalog.RequiresValue.Contains(request.Type) && value == null)
            throw new BusinessRuleException("Este tipo de regra precisa de um valor.");
        var note = Input.Text(request.Note, EntityLimits.RuleNoteLength, "A observação");

        ClassificationRule rule;
        if (request.RuleId is { } id)
        {
            rule = await _ruleRepository.GetByIdAsync(id) ?? throw RuleCatalog.NotFound();
            rule.Change(request.Type, pattern, value, request.Priority, note);
            await _ruleRepository.UpdateAsync(rule);
        }
        else
        {
            rule = ClassificationRule.Create(request.Type, pattern, value, request.Priority, note);
            await _ruleRepository.CreateAsync(rule);
        }

        await _activityLogRepository.CreateAsync(new ActivityLog
        {
            UserId = request.UserId,
            Source = "Regras",
            Description = Truncate($"Regra {(request.RuleId == null ? "criada" : "alterada")}: {rule.Type} \"{rule.Pattern}\""),
        });
        return GetRulesHandler.ToDto(rule);
    }

    public static string Truncate(string text) => text.Length <= 500 ? text : text[..497] + "...";
}

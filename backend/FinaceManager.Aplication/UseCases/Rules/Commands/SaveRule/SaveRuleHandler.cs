using FinanceManager.Aplication.Caching;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;

public class SaveRuleHandler : IRequestHandler<SaveRuleCommand, RuleDto?>
{
    private readonly IClassificationRuleRepository _ruleRepository;
    private readonly IActivityLogRepository _activityLogRepository;
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserDataVersions _versions;

    public SaveRuleHandler(
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

    public async Task<RuleDto?> Handle(SaveRuleCommand request, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(request.Type)) throw new BusinessRuleException("Tipo de regra inválido.");
        var pattern = request.Pattern?.Trim() ?? string.Empty;
        var problem = RuleCatalog.PatternError(pattern);
        if (problem != null) throw new BusinessRuleException(problem);
        var value = string.IsNullOrWhiteSpace(request.Value) ? null : request.Value.Trim();
        if (RuleCatalog.RequiresValue.Contains(request.Type) && value == null)
            throw new BusinessRuleException("Este tipo de regra precisa de um valor.");
        if (value?.Length > RuleCatalog.MaxValueLength) throw new BusinessRuleException($"O valor pode ter até {RuleCatalog.MaxValueLength} caracteres.");
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (note?.Length > RuleCatalog.MaxNoteLength) throw new BusinessRuleException($"A observação pode ter até {RuleCatalog.MaxNoteLength} caracteres.");

        ClassificationRule rule;
        if (request.RuleId is { } id)
        {
            var found = await _ruleRepository.GetByIdAsync(id);
            if (found == null) return null;
            rule = found;
            rule.Type = request.Type;
            rule.Pattern = pattern;
            rule.Value = value;
            rule.Priority = request.Priority;
            rule.Note = note;
            await _ruleRepository.UpdateAsync(rule);
        }
        else
        {
            rule = new ClassificationRule { Type = request.Type, Pattern = pattern, Value = value, Priority = request.Priority, Note = note };
            await _ruleRepository.CreateAsync(rule);
        }

        await _activityLogRepository.CreateAsync(new ActivityLog
        {
            UserId = request.UserId,
            Source = "Regras",
            Description = Truncate($"Regra {(request.RuleId == null ? "criada" : "alterada")}: {rule.Type} \"{rule.Pattern}\""),
        });
        RulesChanged.AfterCommit(_unitOfWork, _rulesProvider, _versions);
        return GetRulesHandler.ToDto(rule);
    }

    public static string Truncate(string text) => text.Length <= 500 ? text : text[..497] + "...";
}

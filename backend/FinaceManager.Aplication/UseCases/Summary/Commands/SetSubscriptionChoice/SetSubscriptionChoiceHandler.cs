using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Commands.SetSubscriptionChoice;

public class SetSubscriptionChoiceHandler : IRequestHandler<SetSubscriptionChoiceCommand, bool>
{
    public const int MaxLength = EntityLimits.KeyLength;

    private readonly ISubscriptionDecisionRepository _decisionRepository;

    public SetSubscriptionChoiceHandler(ISubscriptionDecisionRepository decisionRepository)
    {
        _decisionRepository = decisionRepository;
    }

    public async Task<bool> Handle(SetSubscriptionChoiceCommand request, CancellationToken cancellationToken = default)
    {
        var key = request.Key?.Trim() ?? string.Empty;
        if (key.Length == 0 || key.Length > MaxLength) throw new BusinessRuleException("Assinatura inválida.");
        if (request.Choice is { } choice && !Enum.IsDefined(choice)) throw new BusinessRuleException("Decisão inválida.");
        var name = string.IsNullOrWhiteSpace(request.Name) ? key : request.Name.Trim();
        if (name.Length > MaxLength) name = name[..MaxLength];

        var decision = await _decisionRepository.GetAsync(request.UserId, key);
        if (request.Choice == null)
        {
            if (decision == null) return false;
            await _decisionRepository.DeleteAsync(decision);
            return true;
        }
        if (decision == null)
        {
            await _decisionRepository.CreateAsync(new SubscriptionDecision
            {
                UserId = request.UserId, MerchantKey = key, Name = name, Choice = request.Choice.Value, DecidedAt = request.Now,
            });
            return true;
        }
        if (decision.Choice == request.Choice) return false;
        decision.Choice = request.Choice.Value;
        decision.DecidedAt = request.Now;
        decision.Name = name;
        await _decisionRepository.UpdateAsync(decision);
        return true;
    }
}

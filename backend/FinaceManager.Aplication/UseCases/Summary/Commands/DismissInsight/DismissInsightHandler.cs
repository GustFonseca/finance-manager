using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Commands.DismissInsight;

public class DismissInsightHandler : IRequestHandler<DismissInsightCommand, bool>
{
    public const int MaxKeyLength = EntityLimits.KeyLength;
    private static readonly string[] Prefixes = [DuplicateChargeDetector.KeyPrefix, BillIncreaseDetector.KeyPrefix];

    private readonly IInsightDismissalRepository _dismissalRepository;

    public DismissInsightHandler(IInsightDismissalRepository dismissalRepository)
    {
        _dismissalRepository = dismissalRepository;
    }

    public async Task<bool> Handle(DismissInsightCommand request, CancellationToken cancellationToken = default)
    {
        var key = request.Key?.Trim() ?? string.Empty;
        if (key.Length == 0 || key.Length > MaxKeyLength || !Prefixes.Any(key.StartsWith))
            throw new BusinessRuleException("Alerta inválido.");
        if (await _dismissalRepository.ExistsAsync(request.UserId, key)) return false;
        await _dismissalRepository.CreateAsync(new InsightDismissal { UserId = request.UserId, Key = key });
        return true;
    }
}

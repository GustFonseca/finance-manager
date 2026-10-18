using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Challenges.Commands.CreateChallenge;

public class CreateChallengeHandler : IRequestHandler<CreateChallengeCommand, ChallengeDto>
{
    public const int MaxNameLength = 100;

    private readonly IChallengeRepository _challengeRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMerchantRepository _merchantRepository;

    public CreateChallengeHandler(IChallengeRepository challengeRepository, ICategoryRepository categoryRepository, IMerchantRepository merchantRepository)
    {
        _challengeRepository = challengeRepository;
        _categoryRepository = categoryRepository;
        _merchantRepository = merchantRepository;
    }

    public async Task<ChallengeDto> Handle(CreateChallengeCommand request, CancellationToken cancellationToken = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0) throw new BusinessRuleException("Dê um nome ao desafio.");
        if (name.Length > MaxNameLength) throw new BusinessRuleException($"O nome do desafio pode ter até {MaxNameLength} caracteres.");
        if (request.Days < 1 || request.Days > ChallengeTracker.MaxDays)
            throw new BusinessRuleException($"O desafio deve durar de 1 a {ChallengeTracker.MaxDays} dias.");
        if (request.LimitCents < 0) throw new BusinessRuleException("O limite não pode ser negativo.");
        if (request.StartsOn > request.Now.AddDays(ChallengeTracker.MaxDays))
            throw new BusinessRuleException("O desafio deve começar nos próximos 90 dias.");

        var targetName = await TargetNameAsync(request);
        var challenge = new Challenge
        {
            UserId = request.UserId,
            Name = name,
            Scope = request.Scope,
            TargetId = request.Scope == ChallengeScope.SUPERFLUOUS ? null : request.TargetId,
            LimitCents = request.LimitCents,
            StartsOn = request.StartsOn.ToUniversalTime(),
            Days = request.Days,
        };
        await _challengeRepository.CreateAsync(challenge);
        return ChallengeTracker.Track(challenge, [], request.Now, targetName, Classification.ClassificationRules.Empty);
    }

    private async Task<string> TargetNameAsync(CreateChallengeCommand request)
    {
        switch (request.Scope)
        {
            case ChallengeScope.CATEGORY:
                var category = request.TargetId is { } categoryId ? await _categoryRepository.GetByIdAsync(categoryId) : null;
                if (category == null || category.UserId != request.UserId || category.Type != CategoryType.EXPENSE)
                    throw new BusinessRuleException("Escolha uma categoria de despesa.");
                return category.Name;
            case ChallengeScope.MERCHANT:
                var merchant = request.TargetId is { } merchantId ? await _merchantRepository.GetByIdAsync(merchantId) : null;
                if (merchant == null || merchant.UserId != request.UserId)
                    throw new BusinessRuleException("Escolha um estabelecimento.");
                return merchant.Name;
            case ChallengeScope.SUPERFLUOUS:
                return "Gastos supérfluos";
            default:
                throw new BusinessRuleException("Tipo de desafio inválido.");
        }
    }
}

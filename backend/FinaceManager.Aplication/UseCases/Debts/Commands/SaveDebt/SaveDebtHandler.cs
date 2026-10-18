using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Debts.Commands.SaveDebt;

public class SaveDebtHandler : IRequestHandler<SaveDebtCommand, DebtDto?>
{
    private readonly IDebtRepository _debtRepository;

    public SaveDebtHandler(IDebtRepository debtRepository)
    {
        _debtRepository = debtRepository;
    }

    public async Task<DebtDto?> Handle(SaveDebtCommand request, CancellationToken cancellationToken = default)
    {
        var name = DebtMapper.Validate(request.Name, request.BalanceCents, request.MonthlyRatePercent, request.MinimumPaymentCents);
        Debt debt;
        if (request.DebtId is { } id)
        {
            var found = await _debtRepository.GetByIdAsync(id);
            if (found == null || found.UserId != request.UserId) return null;
            debt = found;
            debt.Name = name;
            debt.BalanceCents = request.BalanceCents;
            debt.MonthlyRatePercent = request.MonthlyRatePercent;
            debt.MinimumPaymentCents = request.MinimumPaymentCents;
            await _debtRepository.UpdateAsync(debt);
        }
        else
        {
            debt = new Debt
            {
                UserId = request.UserId, Name = name, BalanceCents = request.BalanceCents,
                MonthlyRatePercent = request.MonthlyRatePercent, MinimumPaymentCents = request.MinimumPaymentCents,
            };
            await _debtRepository.CreateAsync(debt);
        }
        return DebtMapper.ToDto(debt);
    }
}

using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.UseCases.Debts;

public static class DebtMapper
{
    public const decimal MaxMonthlyRatePercent = 50m;

    public static DebtDto ToDto(Debt debt) => new()
    {
        Id = debt.Id,
        Name = debt.Name,
        BalanceCents = debt.BalanceCents,
        MonthlyRatePercent = debt.MonthlyRatePercent,
        MinimumPaymentCents = debt.MinimumPaymentCents,
    };

    public static string Validate(string? name, long balanceCents, decimal monthlyRatePercent, long minimumPaymentCents)
    {
        var trimmed = Input.Name(name, emptyMessage: "Dê um nome à dívida.");
        if (balanceCents < 0) throw new BusinessRuleException("O saldo devedor não pode ser negativo.");
        if (monthlyRatePercent < 0 || monthlyRatePercent > MaxMonthlyRatePercent)
            throw new BusinessRuleException($"Os juros devem ficar entre 0% e {MaxMonthlyRatePercent}% ao mês.");
        if (minimumPaymentCents <= 0) throw new BusinessRuleException("Informe a parcela mínima.");
        return trimmed;
    }
}

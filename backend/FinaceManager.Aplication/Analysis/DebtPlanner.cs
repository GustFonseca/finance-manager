using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Analysis;

public static class DebtPlanner
{
    public const int MaxMonths = 600;
    public const int MaxGrowth = 10;

    public static DebtPlanDto Plan(IReadOnlyList<Debt> debts, long extraCents)
    {
        var budget = debts.Sum(d => d.MinimumPaymentCents) + Math.Max(0, extraCents);
        var avalanche = Simulate(debts, budget, list => list.OrderByDescending(d => d.Rate).ThenBy(d => d.Balance));
        var snowball = Simulate(debts, budget, list => list.OrderBy(d => d.Balance).ThenByDescending(d => d.Rate));
        return new DebtPlanDto
        {
            MonthlyBudgetCents = budget,
            ExtraCents = Math.Max(0, extraCents),
            Avalanche = avalanche,
            Snowball = snowball,
            InterestSavedWithAvalancheCents = avalanche.Feasible && snowball.Feasible
                ? Math.Max(0, snowball.TotalInterestCents - avalanche.TotalInterestCents)
                : 0,
        };
    }

    private sealed class Running
    {
        public required Debt Source { get; init; }
        public decimal Balance { get; set; }
        public decimal Rate => Source.MonthlyRatePercent / 100m;
    }

    private static DebtStrategyDto Simulate(IReadOnlyList<Debt> debts, long budget, Func<IEnumerable<Running>, IEnumerable<Running>> priority)
    {
        var open = debts.Where(d => d.BalanceCents > 0).Select(d => new Running { Source = d, Balance = d.BalanceCents }).ToList();
        var result = new DebtStrategyDto { Feasible = true };
        var ceiling = open.Sum(d => d.Balance) * MaxGrowth;
        decimal interest = 0;
        var month = 0;
        while (open.Count > 0)
        {
            month++;
            if (month > MaxMonths || open.Sum(d => d.Balance) > ceiling)
                return new DebtStrategyDto { Feasible = false, Months = month - 1, TotalInterestCents = (long)Math.Round(interest) };
            foreach (var debt in open)
            {
                var charge = debt.Balance * debt.Rate;
                interest += charge;
                debt.Balance += charge;
            }
            decimal available = budget;
            foreach (var debt in open)
            {
                var pay = Math.Min(debt.Balance, Math.Min(debt.Source.MinimumPaymentCents, available));
                debt.Balance -= pay;
                available -= pay;
            }
            foreach (var debt in priority(open.Where(d => d.Balance > 0)).ToList())
            {
                if (available <= 0) break;
                var pay = Math.Min(debt.Balance, available);
                debt.Balance -= pay;
                available -= pay;
            }
            foreach (var paid in open.Where(d => d.Balance <= 0.5m).ToList())
            {
                result.Order.Add(new DebtPayoffDto { DebtId = paid.Source.Id, Name = paid.Source.Name, PaidOffInMonth = month });
                open.Remove(paid);
            }
        }
        result.Months = month;
        result.TotalInterestCents = (long)Math.Round(interest);
        return result;
    }
}

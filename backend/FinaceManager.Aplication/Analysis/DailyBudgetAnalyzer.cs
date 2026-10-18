using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public record DailyBudgetInput(
    IReadOnlyList<Transaction> Transactions,
    IReadOnlyList<Category> ExpenseCategories,
    IReadOnlyDictionary<Guid, long> Budgets,
    long GoalCents,
    int WorkHoursPerMonth,
    DateTime MonthStart,
    DateTime Now,
    DateTime DayStart,
    ClassificationRules Rules);

public static class DailyBudgetAnalyzer
{
    public const double WarningRatio = 0.8;

    public static DailyBudgetDto Analyze(DailyBudgetInput input)
    {
        var rules = input.Rules;
        var monthEnd = input.MonthStart.AddMonths(1);
        var isCurrentMonth = input.DayStart >= input.MonthStart && input.DayStart < monthEnd && input.Now < monthEnd;
        var daysLeft = isCurrentMonth ? Math.Max(1, (int)Math.Ceiling((monthEnd - input.DayStart).TotalDays)) : 0;
        var expenses = input.Transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= input.Now && !t.IsOwnMoney(rules))
            .ToList();

        var result = new DailyBudgetDto
        {
            IsCurrentMonth = isCurrentMonth,
            DaysLeft = daysLeft,
            MonthlyGoalCents = input.GoalCents,
            WorkHoursPerMonth = input.WorkHoursPerMonth,
            HourValueCents = WorkValue.HourCents(input.Transactions, input.MonthStart, input.WorkHoursPerMonth, rules),
            Budgets = Budgets(input, expenses, monthEnd, Math.Max(1, daysLeft)),
        };
        if (!isCurrentMonth) return result;

        var forecast = CashFlowForecaster.Forecast(input.Transactions, input.MonthStart, input.Now, rules);
        var fixedKeys = RecurringExpenseDetector.Detect(input.Transactions, input.Now, rules).Select(r => r.Key).ToHashSet();
        var spentToday = expenses
            .Where(t => t.Date >= input.DayStart && !fixedKeys.Contains(t.MerchantKey(rules)) && InstallmentDetector.Parse(t) == null)
            .Sum(t => t.AmountCents);
        var free = forecast.ProjectedIncomeCents - forecast.ExpenseSoFarCents - forecast.PendingBillsCents - input.GoalCents;
        var allowance = Math.Max(0, free + spentToday) / daysLeft;

        result.FreeToSpendCents = free;
        result.SpentTodayCents = spentToday;
        result.TodayAllowanceCents = allowance;
        result.LeftTodayCents = allowance - spentToday;
        return result;
    }

    private static List<BudgetStatusDto> Budgets(DailyBudgetInput input, List<Transaction> expenses, DateTime monthEnd, int daysLeft) =>
        input.ExpenseCategories
            .Where(c => input.Budgets.TryGetValue(c.Id, out var limit) && limit > 0)
            .Select(c =>
            {
                var limit = input.Budgets[c.Id];
                var spent = expenses.Where(t => t.CategoryId == c.Id && t.Date >= input.MonthStart && t.Date < monthEnd).Sum(t => t.AmountCents);
                var percent = (double)spent / limit;
                return new BudgetStatusDto
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    Color = c.Color,
                    LimitCents = limit,
                    SpentCents = spent,
                    Percent = Math.Round(percent, 3),
                    Level = percent >= 1 ? BudgetLevel.EXCEEDED : percent >= WarningRatio ? BudgetLevel.WARNING : BudgetLevel.OK,
                    PerDayLeftCents = Math.Max(0, limit - spent) / daysLeft,
                };
            })
            .OrderByDescending(b => b.Percent)
            .ThenBy(b => b.CategoryName)
            .ToList();
}

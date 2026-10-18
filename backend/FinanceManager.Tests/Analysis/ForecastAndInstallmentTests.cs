using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class ForecastAndInstallmentTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime Now = new(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = Cat("Lazer", CategoryType.EXPENSE);
    private static readonly Category Salario = Cat("Salário", CategoryType.INCOME);

    private static Category Cat(string name, CategoryType type) => new() { UserId = Me, Name = name, Type = type, Color = "#000" };

    private static DateTime Day(int month, int day) => new(2026, month, day, 12, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(string description, long cents, DateTime date, TransactionType type = TransactionType.EXPENSE) => new()
    {
        UserId = Me,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = type == TransactionType.INCOME ? Salario : Lazer,
        CategoryId = (type == TransactionType.INCOME ? Salario : Lazer).Id,
        Description = description,
        AmountCents = cents,
        Type = type,
        Date = date,
    };

    private static Transaction Income(string description, long cents, DateTime date) => Tx(description, cents, date, TransactionType.INCOME);

    private static CashFlowForecastDto Forecast(IEnumerable<Transaction> transactions, DateTime? now = null, DateTime? monthStart = null) =>
        CashFlowForecaster.Forecast(transactions.ToList(), monthStart ?? MonthStart, now ?? Now, TestRules.Default);

    [Theory]
    [InlineData("Loja X - Parcela 3/10", 3, 10)]
    [InlineData("Magazine parcela 2 de 6", 2, 6)]
    [InlineData("Compra Loja 01/12", 1, 12)]
    public void Installments_are_read_from_the_description(string description, int number, int total)
    {
        var installment = InstallmentDetector.Parse(Tx(description, 1000, Day(10, 1)))!;

        Assert.Equal(number, installment.Number);
        Assert.Equal(total, installment.Total);
    }

    [Theory]
    [InlineData("Mercado")]
    [InlineData("Loja Parcela 5/3")]
    [InlineData("Loja 1/1")]
    [InlineData("Loja Parcela 0/3")]
    public void Descriptions_without_a_valid_installment_are_ignored(string description)
    {
        Assert.Null(InstallmentDetector.Parse(Tx(description, 1000, Day(10, 1))));
    }

    [Fact]
    public void Active_installments_show_what_is_left_to_pay_and_finished_or_stale_ones_are_dropped()
    {
        var result = InstallmentDetector.Detect(
        [
            Tx("Magazine - Parcela 2/10", 10000, Day(8, 10)),
            Tx("Magazine - Parcela 3/10", 10000, Day(9, 10)),
            Tx("Celular - Parcela 4/4", 50000, Day(9, 20)),
            Tx("Sofa - Parcela 2/5", 30000, Day(5, 1)),
            Tx("Curso 1/3", 20000, Day(10, 2)),
            Income("Estorno - Parcela 1/2", 999, Day(10, 2)),
        ], Now, TestRules.Default);

        Assert.Equal(2, result.Items.Count);
        var magazine = Assert.Single(result.Items, i => i.Name == "Magazine");
        Assert.Equal(3, magazine.Paid);
        Assert.Equal(10, magazine.Total);
        Assert.Equal(70000, magazine.RemainingCents);
        Assert.Equal(Day(9, 10).AddMonths(7), magazine.EndsOn);
        Assert.Equal("magazine", magazine.Key);
        Assert.Equal(30000, result.MonthlyCents);
        Assert.Equal(110000, result.RemainingCents);
        Assert.Equal("Curso", result.Items[0].Name);
    }

    [Fact]
    public void The_forecast_adds_the_expected_salary_pending_bills_installments_and_daily_rhythm()
    {
        var transactions = new List<Transaction>();
        foreach (var month in new[] { 7, 8, 9 })
        {
            transactions.Add(Income("Empresa Acme Ltda", 500000, Day(month, 25)));
            transactions.Add(Tx("Claro Internet", 12000, Day(month, 20)));
            transactions.Add(Tx("Padaria Pão Bom", 700 * month, Day(month, 3)));
        }
        transactions.Add(Tx("Magazine - Parcela 3/10", 10000, Day(9, 18)));
        transactions.Add(Income("Freela avulso", 30000, Day(9, 2)));
        transactions.Add(Tx("Mercado", 40000, Day(10, 5)));
        transactions.Add(Income("Pix recebido", 10000, Day(10, 6)));

        var result = Forecast(transactions);

        Assert.True(result.IsCurrentMonth);
        Assert.Equal(16, result.RemainingDays);
        Assert.Equal(10000, result.IncomeSoFarCents);
        Assert.Equal(40000, result.ExpenseSoFarCents);
        Assert.Equal(500000, result.PendingIncomeCents);
        Assert.Equal(22000, result.PendingBillsCents);
        Assert.Equal(510000, result.ProjectedIncomeCents);
        Assert.Equal(result.ExpenseSoFarCents + result.PendingBillsCents + result.VariableEstimateCents, result.ProjectedExpenseCents);
        Assert.Equal(result.ProjectedIncomeCents - result.ProjectedExpenseCents, result.ProjectedBalanceCents);

        Assert.Collection(result.Upcoming,
            i => { Assert.Equal(ForecastItemKind.INSTALLMENT, i.Kind); Assert.Equal("Magazine (4/10)", i.Name); Assert.Equal(Day(10, 18).Date, i.ExpectedDate.Date); },
            i => { Assert.Equal(ForecastItemKind.BILL, i.Kind); Assert.Equal(12000, i.AmountCents); Assert.Equal(20, i.ExpectedDate.Day); },
            i => { Assert.Equal(ForecastItemKind.INCOME, i.Kind); Assert.Equal(25, i.ExpectedDate.Day); });
        Assert.Equal(500000, result.NextIncome!.AmountCents);
        Assert.Single(result.Installments.Items);
    }

    [Fact]
    public void Variable_spending_follows_the_weekday_rhythm_of_the_last_months()
    {
        var transactions = new List<Transaction>();
        foreach (var month in new[] { 7, 8, 9 })
            for (var day = 1; day <= DateTime.DaysInMonth(2026, month); day++)
                if (Day(month, day).DayOfWeek == DayOfWeek.Saturday)
                    transactions.Add(Tx($"Bar {month}-{day}", 7000, Day(month, day)));

        var result = Forecast(transactions);

        var saturdaysLeft = Enumerable.Range(16, 16).Count(d => Day(10, d).DayOfWeek == DayOfWeek.Saturday);
        Assert.Equal(saturdaysLeft * 7000, result.VariableEstimateCents);
        Assert.Empty(result.Upcoming);
        Assert.Null(result.NextIncome);
    }

    [Fact]
    public void Income_already_received_and_bills_already_paid_are_not_expected_again()
    {
        var transactions = new List<Transaction>();
        foreach (var month in new[] { 8, 9, 10 })
        {
            transactions.Add(Income("Empresa Acme Ltda", 500000, Day(month, 5)));
            transactions.Add(Tx("Claro Internet", 12000, Day(month, 10)));
        }

        var result = Forecast(transactions);

        Assert.Empty(result.Upcoming);
        Assert.Equal(500000, result.ProjectedIncomeCents);
    }

    [Fact]
    public void A_late_salary_is_expected_tomorrow()
    {
        var transactions = new[] { 8, 9 }.Select(m => Income("Empresa Acme Ltda", 500000, Day(m, 5))).ToList();

        var result = Forecast(transactions);

        Assert.Equal(Now.Date.AddDays(1), Assert.Single(result.Upcoming).ExpectedDate);
    }

    [Fact]
    public void A_closed_month_is_not_projected_and_own_transfers_are_ignored()
    {
        var transactions = new List<Transaction>
        {
            Income("Empresa Acme Ltda", 500000, Day(8, 5)),
            Income("Empresa Acme Ltda", 500000, Day(9, 5)),
            Tx("Mercado", 40000, Day(9, 5)),
            Tx("Pagamento de fatura", 90000, Day(9, 6)),
        };

        var result = Forecast(transactions, now: new DateTime(2026, 9, 30, 23, 59, 59, DateTimeKind.Utc), monthStart: Day(9, 1).Date);

        Assert.False(result.IsCurrentMonth);
        Assert.Equal(0, result.RemainingDays);
        Assert.Empty(result.Upcoming);
        Assert.Equal(0, result.VariableEstimateCents);
        Assert.Equal(500000, result.ProjectedIncomeCents);
        Assert.Equal(40000, result.ProjectedExpenseCents);
    }

    [Fact]
    public void Without_history_only_the_month_so_far_is_shown()
    {
        var result = Forecast([Tx("Mercado", 40000, Day(10, 5))]);

        Assert.Equal(0, result.VariableEstimateCents);
        Assert.Equal(-40000, result.ProjectedBalanceCents);
    }
}

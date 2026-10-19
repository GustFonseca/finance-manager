using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Tests.Analysis;

public class ReviewFixesTests
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly DateTime MonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
    private static readonly Account Nubank = new(Me, "Nubank");
    private static readonly Category Lazer = Cat("Lazer", CategoryType.EXPENSE);
    private static readonly Category Saude = Cat("Saúde", CategoryType.EXPENSE);
    private static readonly Category Salario = Cat("Salário", CategoryType.INCOME);

    private static Category Cat(string name, CategoryType type) => new() { UserId = Me, Name = name, Type = type, Color = "#000000" };

    private static DateTime Noon(int month, int day, int year = 2026) => new(year, month, day, 15, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(string description, long cents, DateTime date, TransactionType type = TransactionType.EXPENSE,
        Recurrence recurrence = Recurrence.NONE, Category? category = null, Merchant? merchant = null) => new()
    {
        UserId = Me,
        Account = Nubank,
        AccountId = Nubank.Id,
        Category = category ?? (type == TransactionType.INCOME ? Salario : Lazer),
        CategoryId = (category ?? (type == TransactionType.INCOME ? Salario : Lazer)).Id,
        Description = description,
        AmountCents = cents,
        Type = type,
        Date = date,
        Recurrence = recurrence,
        Merchant = merchant,
        MerchantId = merchant?.Id,
    };

    private static DateTime EndOfLocalDay(DateTime instant) => LocalDay.EndOfDay(MonthStart, instant);

    [Fact]
    public void The_remaining_days_follow_the_local_calendar_even_late_at_night()
    {
        var lateOn30th = new DateTime(2026, 10, 31, 1, 30, 0, DateTimeKind.Utc);
        var morning19th = new DateTime(2026, 10, 19, 11, 0, 0, DateTimeKind.Utc);

        var night = CashFlowForecaster.Forecast([], MonthStart, EndOfLocalDay(lateOn30th), TestRules.Default);
        var morning = CashFlowForecaster.Forecast([], MonthStart, EndOfLocalDay(morning19th), TestRules.Default);

        Assert.Equal((true, 1), (night.IsCurrentMonth, night.RemainingDays));
        Assert.Equal(12, morning.RemainingDays);
    }

    [Fact]
    public void Todays_purchase_at_local_noon_counts_as_spent_already()
    {
        var morning = new DateTime(2026, 10, 19, 11, 0, 0, DateTimeKind.Utc);

        var forecast = CashFlowForecaster.Forecast([Tx("Padaria", 1500, Noon(10, 19))], MonthStart, EndOfLocalDay(morning), TestRules.Default);

        Assert.Equal(1500, forecast.ExpenseSoFarCents);
    }

    [Fact]
    public void The_variable_estimate_covers_exactly_the_remaining_local_days()
    {
        var history = new List<Transaction>();
        for (var day = new DateTime(2026, 7, 1, 15, 0, 0, DateTimeKind.Utc); day < new DateTime(2026, 10, 1); day = day.AddDays(1))
            history.Add(Tx("Padaria Real", 1000, day));

        var forecast = CashFlowForecaster.Forecast(history, MonthStart, EndOfLocalDay(new DateTime(2026, 10, 31, 1, 30, 0, DateTimeKind.Utc)), TestRules.Default);

        Assert.Equal(1000, forecast.VariableEstimateCents);
    }

    [Fact]
    public void A_salary_paid_in_parts_keeps_the_rest_pending()
    {
        var transactions = new List<Transaction>
        {
            Tx("Salário ACME", 500000, Noon(8, 5), TransactionType.INCOME),
            Tx("Salário ACME", 500000, Noon(9, 5), TransactionType.INCOME),
            Tx("Salário ACME", 200000, Noon(10, 5), TransactionType.INCOME),
        };

        var forecast = CashFlowForecaster.Forecast(transactions, MonthStart, EndOfLocalDay(Noon(10, 10)), TestRules.Default);

        var pending = Assert.Single(forecast.Upcoming, i => i.Kind == ForecastItemKind.INCOME);
        Assert.Equal(300000, pending.AmountCents);
        Assert.Equal(LocalDay.Next(MonthStart, Noon(10, 10)), pending.ExpectedDate);
    }

    [Fact]
    public void A_salary_received_in_full_is_not_pending_anymore()
    {
        var transactions = new List<Transaction>
        {
            Tx("Salário ACME", 500000, Noon(8, 5), TransactionType.INCOME),
            Tx("Salário ACME", 500000, Noon(9, 5), TransactionType.INCOME),
            Tx("Salário ACME", 600000, Noon(10, 5), TransactionType.INCOME),
        };

        var forecast = CashFlowForecaster.Forecast(transactions, MonthStart, EndOfLocalDay(Noon(10, 10)), TestRules.Default);

        Assert.DoesNotContain(forecast.Upcoming, i => i.Kind == ForecastItemKind.INCOME);
    }

    [Fact]
    public void Weekly_bills_keep_what_is_left_of_the_month_pending_and_yearly_ones_are_left_to_the_seasonal_plan()
    {
        var transactions = new List<Transaction>
        {
            Tx("Diarista Ana", 10000, Noon(10, 3), recurrence: Recurrence.WEEKLY),
            Tx("Diarista Ana", 10000, Noon(10, 10), recurrence: Recurrence.WEEKLY),
            Tx("Seguro Anual", 120000, Noon(7, 20), recurrence: Recurrence.YEARLY),
            Tx("Faxina Antiga", 5000, Noon(9, 1), recurrence: Recurrence.WEEKLY),
        };

        var forecast = CashFlowForecaster.Forecast(transactions, MonthStart, EndOfLocalDay(Noon(10, 12)), TestRules.Default);

        var weekly = Assert.Single(forecast.Upcoming, i => i.Kind == ForecastItemKind.BILL);
        Assert.Equal(10000 * 52 / 12 - 20000, weekly.AmountCents);
        Assert.Equal(new DateTime(2026, 10, 17, 3, 0, 0, DateTimeKind.Utc), weekly.ExpectedDate);
    }

    [Fact]
    public void A_weekly_bill_already_paid_for_the_whole_month_is_not_pending()
    {
        var transactions = Enumerable.Range(0, 5)
            .Select(i => Tx("Diarista Ana", 10000, Noon(10, 1 + i * 6), recurrence: Recurrence.WEEKLY))
            .ToList();

        var forecast = CashFlowForecaster.Forecast(transactions, MonthStart, EndOfLocalDay(Noon(10, 26)), TestRules.Default);

        Assert.DoesNotContain(forecast.Upcoming, i => i.Kind == ForecastItemKind.BILL);
    }

    [Fact]
    public void Installments_are_not_mistaken_for_recurring_bills()
    {
        var transactions = new List<Transaction>
        {
            Tx("Loja Parcela 1/10", 10000, Noon(8, 10)),
            Tx("Loja Parcela 2/10", 10000, Noon(9, 10)),
            Tx("Loja Parcela 3/10", 10000, Noon(10, 10)),
        };

        Assert.Empty(RecurringExpenseDetector.Detect(transactions, Noon(10, 15), TestRules.Default));
    }

    [Fact]
    public void Marked_recurrences_must_still_be_active_for_their_period()
    {
        var transactions = new List<Transaction>
        {
            Tx("Diarista Ana", 10000, Noon(9, 10), recurrence: Recurrence.WEEKLY),
            Tx("Aluguel", 200000, Noon(9, 10), recurrence: Recurrence.MONTHLY),
            Tx("Café da manhã", 1000, Noon(10, 1), recurrence: Recurrence.DAILY),
            Tx("Seguro Anual", 120000, Noon(7, 1), recurrence: Recurrence.YEARLY),
        };

        var recurring = RecurringExpenseDetector.Detect(transactions, Noon(10, 15), TestRules.Default);

        Assert.Equal(["Aluguel", "Seguro Anual"], recurring.Select(r => r.Name).Order());
        Assert.Equal(Recurrence.YEARLY, recurring.Single(r => r.Name == "Seguro Anual").Period);
        Assert.Equal(10000, recurring.Single(r => r.Name == "Seguro Anual").MonthlyCents);
    }

    [Fact]
    public void The_usual_amount_of_a_detected_bill_is_the_median_of_an_even_count()
    {
        var transactions = new List<Transaction>
        {
            Tx("Enel Distribuicao", 10000, Noon(7, 10)),
            Tx("Enel Distribuicao", 12000, Noon(8, 10)),
            Tx("Enel Distribuicao", 14000, Noon(9, 10)),
            Tx("Enel Distribuicao", 16000, Noon(10, 10)),
        };

        var bill = Assert.Single(RecurringExpenseDetector.Detect(transactions, Noon(10, 15), TestRules.Default));

        Assert.Equal(13000, bill.MonthlyCents);
        Assert.True(bill.Detected);
    }

    [Fact]
    public void A_yearly_marked_subscription_is_shown_by_its_monthly_share()
    {
        var transactions = new List<Transaction> { Tx("Spotify", 120000, Noon(5, 10), recurrence: Recurrence.YEARLY) };

        var audit = Assert.Single(AvoidableSpendingAnalyzer.Analyze(transactions, MonthStart, Noon(10, 15), TestRules.Default, 0m).Subscriptions);

        Assert.True(audit.Yearly);
        Assert.Equal((10000, 120000), (audit.MonthlyCents, audit.YearlyCents));
        Assert.Equal(120000, audit.InvestedIn12MonthsCents);
        Assert.Null(audit.ResumedAfter);
    }

    [Fact]
    public void A_subscription_charged_a_year_apart_is_inferred_as_yearly()
    {
        var transactions = new List<Transaction>
        {
            Tx("Spotify", 110000, Noon(10, 5, 2025)),
            Tx("Spotify", 120000, Noon(10, 5)),
        };

        var audit = Assert.Single(AvoidableSpendingAnalyzer.Analyze(transactions, MonthStart, Noon(10, 15), TestRules.Default, 0m).Subscriptions);

        Assert.True(audit.Yearly);
        Assert.Equal(10000, audit.MonthlyCents);
        Assert.Equal(110000, audit.PreviousCents);
    }

    [Fact]
    public void Monthly_subscriptions_are_unchanged()
    {
        var transactions = new List<Transaction> { Tx("Spotify", 2190, Noon(9, 5)), Tx("Spotify", 2190, Noon(10, 5)) };

        var audit = Assert.Single(AvoidableSpendingAnalyzer.Analyze(transactions, MonthStart, Noon(10, 15), TestRules.Default, 0m).Subscriptions);

        Assert.False(audit.Yearly);
        Assert.Equal((2190, 2190 * 12), (audit.MonthlyCents, audit.YearlyCents));
    }

    [Fact]
    public void The_spending_analysis_agrees_on_the_monthly_share_of_a_yearly_subscription()
    {
        var transactions = new List<Transaction>
        {
            Tx("Spotify", 120000, Noon(9, 5), recurrence: Recurrence.YEARLY),
            Tx("Padaria", 1000, Noon(10, 5)),
        };

        var analysis = SpendingAnalyzer.Analyze(transactions, MonthStart, Noon(10, 15), TestRules.Default);

        var spotify = Assert.Single(analysis.Reducible, r => r.Name == "Spotify");
        Assert.True(spotify.Subscription);
        Assert.Equal(10000, spotify.MonthlyCents);
    }

    [Fact]
    public void The_merchant_name_decides_before_its_registered_activity()
    {
        var netflix = new Merchant { Name = "Netflix", Activity = "Telecomunicações por satélite" };
        var padaria = new Merchant { Name = "Padaria Real", Activity = "Seguros de vida" };
        var unknown = new Merchant { Name = "Loja X", Activity = "Distribuição de energia elétrica" };
        var nothing = new Merchant { Name = "Loja X", Activity = " " };

        Assert.Equal(SpendingClass.SUPERFLUOUS, SpendingClassifier.Classify(Tx("Compra", 100, Noon(10, 1), merchant: netflix), TestRules.Default));
        Assert.Equal(SpendingClass.VARIABLE, SpendingClassifier.Classify(Tx("Compra", 100, Noon(10, 1), merchant: padaria), TestRules.Default));
        Assert.Equal(SpendingClass.ESSENTIAL, SpendingClassifier.Classify(Tx("Compra", 100, Noon(10, 1), merchant: unknown), TestRules.Default));
        Assert.Equal(SpendingClass.ESSENTIAL, SpendingClassifier.Classify(Tx("Compra", 100, Noon(10, 1), category: Saude, merchant: nothing), TestRules.Default));
    }

    [Theory]
    [InlineData("LOJAS RENNER PARC 02/10", 2, 10)]
    [InlineData("Casas Bahia - Parcela 3 de 12", 3, 12)]
    [InlineData("NETSHOES 03 DE 05", 3, 5)]
    [InlineData("Loja Parc. 4/6", 4, 6)]
    [InlineData("LOJA 02/10", 2, 10)]
    public void More_installment_formats_are_understood(string description, int number, int total)
    {
        var installment = InstallmentDetector.Parse(Tx(description, 1000, Noon(10, 19)))!;

        Assert.Equal((number, total), (installment.Number, installment.Total));
    }

    [Fact]
    public void A_trailing_date_equal_to_the_transaction_day_is_not_an_installment()
    {
        Assert.Null(InstallmentDetector.Parse(Tx("PADARIA REAL 9/10", 1000, Noon(10, 9))));
        Assert.NotNull(InstallmentDetector.Parse(Tx("PADARIA REAL PARC 9/10", 1000, Noon(10, 9))));
        Assert.Null(InstallmentDetector.Parse(new Transaction { Description = null!, Date = Noon(10, 9) }));
    }

    [Fact]
    public void Savings_history_counts_only_months_with_expenses()
    {
        var transactions = new List<Transaction>
        {
            Tx("Salário ACME", 500000, Noon(7, 5), TransactionType.INCOME),
            Tx("Salário ACME", 500000, Noon(8, 5), TransactionType.INCOME),
            Tx("Padaria", 30000, Noon(9, 10)),
            Tx("Salário ACME", 500000, Noon(9, 5), TransactionType.INCOME),
        };

        var plan = SavingsAnalyzer.Analyze(Input(transactions, Noon(10, 15)));

        Assert.Equal(1, plan.HistoryMonths);
        Assert.Equal(30000, plan.Budgets.Single(b => b.CategoryId == Lazer.Id).AverageCents);
    }

    [Fact]
    public void Early_in_the_month_one_purchase_does_not_project_a_huge_overspend()
    {
        var transactions = new List<Transaction>
        {
            Tx("Padaria", 10000, Noon(7, 10)),
            Tx("Padaria", 10000, Noon(8, 10)),
            Tx("Padaria", 10000, Noon(9, 10)),
            Tx("Padaria", 2000, Noon(10, 1)),
        };

        var plan = SavingsAnalyzer.Analyze(Input(transactions, new DateTime(2026, 10, 1, 18, 0, 0, DateTimeKind.Utc)));

        Assert.DoesNotContain(plan.Suggestions, s => s.Kind == SuggestionKind.CATEGORY && s.Title.Contains("acima da média"));
        Assert.True(plan.MonthProgress < SavingsAnalyzer.MinProjectionElapsed);
    }

    private static SavingsAnalysisInput Input(List<Transaction> transactions, DateTime now) =>
        new(transactions, [Lazer], new Dictionary<Guid, long>(), 0, MonthStart, now, [], TestRules.Default);

    [Fact]
    public void Month_to_date_comparison_never_reaches_into_the_current_month()
    {
        var transactions = new List<Transaction>
        {
            Tx("Padaria", 1000, Noon(9, 15)),
            Tx("Padaria", 5000, Noon(10, 1)),
        };
        var now = new DateTime(2026, 11, 1, 2, 0, 0, DateTimeKind.Utc);

        var digest = DigestAnalyzer.Build(transactions, [], MonthStart, now, LocalDay.Start(MonthStart, now), TestRules.Default);

        Assert.Equal(5000, digest.Month.SpentCents);
        Assert.Equal(1000, digest.Month.PreviousSpentCents);
    }

    [Fact]
    public void Seasonal_charges_already_paid_this_month_are_not_expected_again()
    {
        var transactions = new List<Transaction>
        {
            Tx("IPVA SP", 150000, Noon(10, 20, 2025)),
            Tx("IPVA SP", 160000, Noon(10, 5)),
        };

        var calendar = CalendarBuilder.Build(transactions, MonthStart, EndOfLocalDay(Noon(10, 10)), LocalDay.Offset(MonthStart), TestRules.Default);

        Assert.DoesNotContain(calendar.Days.SelectMany(d => d.Items), i => i.Kind == CalendarItemKind.SEASONAL);
        Assert.Equal(160000, calendar.Days.Single(d => d.Date.Day == 5).ExpenseCents);
    }

    [Fact]
    public void The_calendar_works_for_zones_ahead_of_utc()
    {
        var berlinOctober = new DateTime(2026, 9, 30, 22, 0, 0, DateTimeKind.Utc);
        var purchase = new DateTime(2026, 10, 1, 10, 0, 0, DateTimeKind.Utc);

        var calendar = CalendarBuilder.Build([Tx("Padaria", 700, purchase)], berlinOctober, LocalDay.EndOfDay(berlinOctober, purchase), LocalDay.Offset(berlinOctober), TestRules.Default);

        Assert.Equal(31, calendar.Days.Count);
        Assert.Equal(new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc), calendar.Days[0].Date);
        Assert.Equal(700, calendar.Days[0].ExpenseCents);
    }

    [Fact]
    public void The_category_name_alone_does_not_make_an_expense_deductible()
    {
        var transactions = new List<Transaction>
        {
            Tx("Drogasil 1234", 5000, Noon(3, 10), category: Saude),
            Tx("Smart Fit Paulista", 9000, Noon(3, 11), category: Saude),
            Tx("Clinica Sorriso Odontologia", 30000, Noon(3, 12), category: Saude),
        };

        var report = TaxReportBuilder.Build(transactions, 2026, TestRules.Default);

        var health = Assert.Single(report.Deductibles);
        Assert.Equal(30000, health.Cents);
    }
}

using FinanceManager.Api.Controllers;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.UseCases.Planning.Queries.GetTaxReport;
using FinanceManager.Aplication.UseCases.Summary.Queries.GetCalendar;
using FinanceManager.Aplication.UseCases.Transactions.Commands.SetReceipt;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.AspNetCore.Mvc;

namespace FinanceManager.Tests.UseCases.Planning;

public class TaxReceiptCalendarTests
{
    private readonly AppDbContext _db = TestDb.InMemory();
    private readonly User _me;
    private readonly Account _account;
    private readonly Category _saude;
    private readonly Category _lazer;
    private readonly Category _salario;

    public TaxReceiptCalendarTests()
    {
        _me = _db.AddUser();
        _account = _db.AddAccount(_me.Id);
        _saude = _db.AddCategory(_me.Id, "Saúde");
        _lazer = _db.AddCategory(_me.Id, "Lazer");
        _salario = _db.AddCategory(_me.Id, "Salário", CategoryType.INCOME);
    }

    private static DateTime Day(int year, int month, int day) => new(year, month, day, 15, 0, 0, DateTimeKind.Utc);

    private Merchant Merchant(string name, string? document)
    {
        var merchant = new Merchant { UserId = _me.Id, Name = name, Key = name.ToLowerInvariant().Replace(" ", ""), Document = document };
        _db.Merchants.Add(merchant);
        _db.SaveChanges();
        return merchant;
    }

    [Fact]
    public async Task The_tax_report_groups_income_sources_and_deductible_expenses_by_provider()
    {
        var acme = Merchant("Acme Tecnologia", "12.345.678/0001-90");
        var dentist = Merchant("Sorriso Odontologia", "98.765.432/0001-10");
        _db.AddTransaction(_account, _salario, 500000, Day(2025, 3, 5), "Salário", acme);
        _db.AddTransaction(_account, _salario, 500000, Day(2025, 4, 5), "Salário", acme);
        _db.AddTransaction(_account, _saude, 30000, Day(2025, 5, 10), "Consulta", dentist);
        _db.AddTransaction(_account, _saude, 20000, Day(2025, 6, 10), "Consulta", dentist);
        _db.AddTransaction(_account, _lazer, 15000, Day(2025, 7, 1), "Mensalidade Colegio Alfa");
        _db.AddTransaction(_account, _lazer, 9000, Day(2025, 7, 2), "Cinema");
        _db.AddTransaction(_account, _saude, 99999, Day(2024, 12, 31), "Consulta ano anterior");
        _db.AddTransaction(_account, _lazer, 88888, Day(2025, 8, 1), "Pagamento de fatura");

        var report = await new GetTaxReportHandler(new TransactionRepository(_db), TestRules.Provider).Handle(new GetTaxReportQuery(_me.Id, 2025));

        Assert.Equal((2025, 1000000L, 74000L, 65000L), (report.Year, report.IncomeCents, report.ExpenseCents, report.DeductibleCents));
        var income = Assert.Single(report.Incomes);
        Assert.Equal(("Acme Tecnologia", "12.345.678/0001-90", 1000000L, 2), (income.Name, income.Document, income.Cents, income.Count));
        Assert.Equal(["Saúde", "Educação"], report.Deductibles.Select(d => d.Label));
        var health = report.Deductibles[0];
        Assert.Equal((50000L, "98.765.432/0001-10"), (health.Cents, health.Providers.Single().Document));
        Assert.Null(report.Deductibles[1].Providers.Single().Document);
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(3000)]
    public async Task Years_out_of_range_are_rejected(int year)
    {
        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new GetTaxReportHandler(new TransactionRepository(_db), TestRules.Provider).Handle(new GetTaxReportQuery(_me.Id, year)));
    }

    [Fact]
    public async Task A_receipt_is_linked_and_unlinked_only_with_the_users_own_files()
    {
        var folder = new Folder { UserId = _me.Id, Name = "Comprovantes" };
        _db.Folders.Add(folder);
        var mine = new StoredFile { UserId = _me.Id, FolderId = folder.Id, Name = "nota.pdf", StorageKey = "k1", ContentType = "application/pdf" };
        var trashed = new StoredFile { UserId = _me.Id, FolderId = folder.Id, Name = "velha.pdf", StorageKey = "k2", ContentType = "application/pdf", DeletedAt = DateTime.UtcNow };
        var foreign = new StoredFile { UserId = Guid.NewGuid(), FolderId = folder.Id, Name = "outro.pdf", StorageKey = "k3", ContentType = "application/pdf" };
        _db.Set<StoredFile>().AddRange(mine, trashed, foreign);
        _db.SaveChanges();
        var transaction = _db.AddTransaction(_account, _saude, 30000, Day(2026, 10, 1), "Consulta");
        var handler = new SetReceiptHandler(new TransactionRepository(_db), new StoredFileRepository(_db), TestDb.Mapper);

        var linked = await handler.Handle(new SetReceiptCommand(_me.Id, transaction.Id, mine.Id));
        Assert.Equal(mine.Id, linked!.ReceiptFileId);
        Assert.Contains(_db.ActivityLogs, a => a.Description.StartsWith("Transação alterada: Consulta"));

        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetReceiptCommand(_me.Id, transaction.Id, trashed.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetReceiptCommand(_me.Id, transaction.Id, foreign.Id)));
        await Assert.ThrowsAsync<BusinessRuleException>(() => handler.Handle(new SetReceiptCommand(_me.Id, transaction.Id, Guid.NewGuid())));
        Assert.Null(await handler.Handle(new SetReceiptCommand(Guid.NewGuid(), transaction.Id, null)));
        Assert.Null(await handler.Handle(new SetReceiptCommand(_me.Id, Guid.NewGuid(), null)));

        var unlinked = await handler.Handle(new SetReceiptCommand(_me.Id, transaction.Id, null));
        Assert.Null(unlinked!.ReceiptFileId);
    }

    [Fact]
    public async Task The_calendar_shows_what_happened_and_what_is_expected_each_day()
    {
        var monthStart = new DateTime(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc);
        foreach (var month in new[] { 8, 9 })
            _db.AddTransaction(_account, _salario, 500000, Day(2026, month, 25), "Empresa Acme");
        _db.AddTransaction(_account, _lazer, 4000, new DateTime(2026, 10, 3, 1, 0, 0, DateTimeKind.Utc), "Cinema");
        _db.AddTransaction(_account, _lazer, 2000, Day(2026, 10, 3), "Pipoca");
        _db.AddTransaction(_account, _salario, 1000, Day(2026, 10, 4), "Pix recebido");
        _db.AddTransaction(_account, _lazer, 50000, Day(2025, 10, 28), "IPVA 2025");
        _db.AddTransaction(_account, _lazer, 9999, Day(2026, 10, 20), "Futuro");

        var calendar = await new GetCalendarHandler(new TransactionRepository(_db), TestRules.Provider).Handle(new GetCalendarQuery(_me.Id, monthStart, now));

        Assert.Equal(31, calendar.Days.Count);
        Assert.Equal(new DateTime(2026, 10, 1), calendar.Days[0].Date.Date);
        var second = calendar.Days[1];
        Assert.Equal(4000, second.ExpenseCents);
        var third = calendar.Days[2];
        Assert.Equal(2000, third.ExpenseCents);
        Assert.Equal(1000, calendar.Days[3].IncomeCents);
        Assert.Equal(500000, calendar.Days[24].ExpectedInCents);
        Assert.Equal(CalendarItemKind.EXPECTED_INCOME, calendar.Days[24].Items.Single().Kind);
        Assert.Equal(50000, calendar.Days[27].ExpectedOutCents);
        Assert.Equal(CalendarItemKind.SEASONAL, calendar.Days[27].Items.Single().Kind);
        Assert.Equal(0, calendar.Days[19].ExpenseCents);
    }

    [Fact]
    public void Each_kind_of_expected_item_lands_on_its_day()
    {
        var monthStart = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 10, 2, 12, 0, 0, DateTimeKind.Utc);
        var transactions = new List<Transaction>();
        Transaction Tx(string d, long c, DateTime date) => new()
        {
            UserId = _me.Id, Account = _account, AccountId = _account.Id, Category = _lazer, CategoryId = _lazer.Id,
            Description = d, AmountCents = c, Date = date, Type = TransactionType.EXPENSE,
        };
        foreach (var month in new[] { 7, 8, 9 }) transactions.Add(Tx("Claro Internet", 12000, Day(2026, month, 20)));
        transactions.Add(Tx("Magazine - Parcela 3/10", 10000, Day(2026, 9, 18)));

        var calendar = CalendarBuilder.Build(transactions, monthStart, now, TimeSpan.Zero, TestRules.Default);

        Assert.Equal(CalendarItemKind.EXPECTED_BILL, calendar.Days[19].Items.Single().Kind);
        Assert.Equal(CalendarItemKind.EXPECTED_INSTALLMENT, calendar.Days[17].Items.Single().Kind);
        Assert.Equal(22000, calendar.Days.Sum(d => d.ExpectedOutCents));
    }

    [Fact]
    public async Task Endpoints_for_tax_report_calendar_and_receipts()
    {
        var mediator = new FakeMediator();
        var me = Guid.NewGuid();
        var planning = new PlanningController(mediator).SignedIn(me);
        var summary = new SummaryController(mediator).SignedIn(me);
        var transactions = new TransactionsController(mediator).SignedIn(me);
        var tx = new TransactionDto { Id = Guid.NewGuid() };
        mediator.Returns<GetTaxReportQuery>(_ => new TaxReportDto());
        mediator.Returns<GetCalendarQuery>(_ => new CalendarDto());
        mediator.Returns<SetReceiptCommand>(c => c.TransactionId == tx.Id ? tx : null);
        var start = new DateTime(2025, 9, 1, 3, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2025, 9, 30, 23, 0, 0, DateTimeKind.Utc);

        Assert.IsType<OkObjectResult>((await planning.GetTaxReport(2024)).Result);
        await planning.GetTaxReport(null);
        Assert.IsType<OkObjectResult>((await summary.GetCalendar(start, end)).Result);
        Assert.IsType<OkObjectResult>((await transactions.SetReceipt(tx.Id, new ReceiptRequest { FileId = Guid.NewGuid() })).Result);
        Assert.IsType<NotFoundResult>((await transactions.SetReceipt(Guid.NewGuid(), new ReceiptRequest())).Result);

        Assert.Equal([2024, DateTime.UtcNow.Year - 1], mediator.Sent.OfType<GetTaxReportQuery>().Select(q => q.Year));
        Assert.Equal(new GetCalendarQuery(me, start, end), mediator.Sent.OfType<GetCalendarQuery>().Single());
    }
}

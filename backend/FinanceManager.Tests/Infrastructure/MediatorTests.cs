using FinanceManager.Aplication;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Accounts.Queries.GetAllAccounts;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Messaging;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Tests.Infrastructure;

public sealed class MediatorTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly User _me;
    private readonly Probe _probe = new();

    public MediatorTests()
    {
        (_db, _connection) = TestDb.Sqlite();
        _me = _db.AddUser();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private IMediator Build(AppDbContext db)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddApplication();
        services.AddSingleton(db);
        services.AddSingleton(_probe);
        services.AddSingleton(TestRules.Provider);
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IRequestHandler<SaveUserCommand, bool>, SaveUserHandler>();
        services.AddScoped<IRequestHandler<PeekQuery, bool>, PeekHandler>();
        services.AddScoped<IRequestHandler<SaveUserAndFail>, SaveUserAndFailHandler>();
        return new Mediator(services.BuildServiceProvider());
    }

    [Fact]
    public async Task Commands_are_dispatched_to_their_handler_and_committed()
    {
        var mediator = Build(_db);

        var account = await mediator.Send(new CreateAccountCommand(_me.Id, "Nubank"));
        var accounts = await mediator.Send(new GetAllAccountsQuery(_me.Id));

        Assert.Equal("Nubank", Assert.Single(accounts).Name);
        Assert.Equal(account.Id, accounts[0].Id);
        Assert.Null(_db.Database.CurrentTransaction);
    }

    [Fact]
    public async Task Commands_run_inside_a_database_transaction_but_queries_do_not()
    {
        var mediator = Build(_db);

        await mediator.Send(new SaveUserCommand("Ana"));
        await mediator.Send(new PeekQuery());

        Assert.Equal([true, false], _probe.InTransaction);
        Assert.Contains(_db.Users.AsNoTracking(), u => u.Name == "Ana");
    }

    [Fact]
    public async Task A_command_already_inside_a_transaction_reuses_it()
    {
        var mediator = Build(_db);
        await using var outer = await _db.Database.BeginTransactionAsync();

        await mediator.Send(new SaveUserCommand("Bia"));

        Assert.Same(outer, _db.Database.CurrentTransaction);
        Assert.Equal([true], _probe.InTransaction);
    }

    [Fact]
    public async Task A_failing_command_rolls_back_everything_it_saved()
    {
        var mediator = Build(_db);

        await Assert.ThrowsAsync<BusinessRuleException>(() => mediator.Send(new SaveUserAndFail("Caio")));

        _db.ChangeTracker.Clear();
        Assert.DoesNotContain(_db.Users, u => u.Name == "Caio");
        Assert.Null(_db.Database.CurrentTransaction);
    }

    [Fact]
    public async Task Commands_without_a_response_are_dispatched_too()
    {
        var mediator = Build(_db);
        var transaction = _db.AddTransaction(_db.AddAccount(_me.Id), _db.AddCategory(_me.Id, "Lazer"), 1000, DateTime.UtcNow);

        await mediator.Send(new DeleteTransactionCommand(_me.Id, transaction.Id));
        var error = await Assert.ThrowsAsync<NotFoundException>(() => mediator.Send(new DeleteTransactionCommand(_me.Id, Guid.NewGuid())));

        Assert.Empty(_db.Transactions);
        Assert.Equal(1000, _db.Accounts.Single().BalanceCents);
        Assert.Equal("Transação não encontrada.", error.Message);
    }

    [Fact]
    public async Task Without_a_relational_database_commands_run_without_a_transaction()
    {
        using var memory = TestDb.InMemory();
        var mediator = Build(memory);

        await mediator.Send(new SaveUserCommand("Duda"));

        Assert.Equal([false], _probe.InTransaction);
        Assert.Single(memory.Users);
    }

    [Fact]
    public async Task A_request_without_a_handler_fails()
    {
        var mediator = Build(_db);

        await Assert.ThrowsAsync<InvalidOperationException>(() => mediator.Send(new OrphanQuery()));
        await Assert.ThrowsAsync<InvalidOperationException>(() => mediator.Send(new OrphanCommand()));
    }

    public sealed class Probe
    {
        public List<bool> InTransaction { get; } = [];
    }

    public record SaveUserCommand(string Name) : ICommand<bool>;

    public record PeekQuery : IQuery<bool>;

    public record SaveUserAndFail(string Name) : ICommand;

    public record OrphanQuery : IQuery<int>;

    public record OrphanCommand : ICommand;

    public sealed class SaveUserHandler(AppDbContext db, Probe probe) : IRequestHandler<SaveUserCommand, bool>
    {
        public async Task<bool> Handle(SaveUserCommand request, CancellationToken cancellationToken = default)
        {
            probe.InTransaction.Add(db.Database.CurrentTransaction != null);
            db.Users.Add(new User { Name = request.Name, Email = $"{request.Name}@test.com", GoogleId = request.Name });
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
    }

    public sealed class PeekHandler(AppDbContext db, Probe probe) : IRequestHandler<PeekQuery, bool>
    {
        public Task<bool> Handle(PeekQuery request, CancellationToken cancellationToken = default)
        {
            probe.InTransaction.Add(db.Database.CurrentTransaction != null);
            return Task.FromResult(true);
        }
    }

    public sealed class SaveUserAndFailHandler(AppDbContext db) : IRequestHandler<SaveUserAndFail>
    {
        public async Task Handle(SaveUserAndFail request, CancellationToken cancellationToken)
        {
            db.Users.Add(new User { Name = request.Name, Email = $"{request.Name}@test.com", GoogleId = request.Name });
            await db.SaveChangesAsync(cancellationToken);
            throw new BusinessRuleException("falhou depois de salvar");
        }
    }
}

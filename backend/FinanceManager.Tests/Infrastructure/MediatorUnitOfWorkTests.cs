using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Messaging;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Tests.Infrastructure;

public sealed class MediatorUnitOfWorkTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly User _me;
    private readonly Probe _probe = new();
    private readonly ListLogger<Mediator> _logger = new();

    public MediatorUnitOfWorkTests()
    {
        (_db, _connection) = TestDb.Sqlite();
        _me = _db.AddUser();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private (IMediator Mediator, UnitOfWork Work) Build(AppDbContext db)
    {
        var services = new ServiceCollection();
        services.AddSingleton(db);
        services.AddSingleton(_probe);
        services.AddSingleton<ILogger<Mediator>>(_logger);
        services.AddScoped<UnitOfWork>();
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<UnitOfWork>());
        services.AddScoped<IRequestHandler<DepositCommand, long>, DepositHandler>();
        services.AddScoped<IRequestHandler<AfterCommitCommand, bool>, AfterCommitHandler>();
        services.AddScoped<IRequestHandler<OuterCommand, bool>, OuterHandler>();
        services.AddScoped<IRequestHandler<AlwaysConflictCommand, bool>, AlwaysConflictHandler>();
        services.AddScoped<IRequestHandler<DuplicateOnceQuery, int>, DuplicateOnceHandler>();
        services.AddScoped<IRequestHandler<OutsideCommand, bool>, OutsideHandler>();
        var provider = services.BuildServiceProvider();
        return (new Mediator(provider), provider.GetRequiredService<UnitOfWork>());
    }

    private Account AddAccount(long balance)
    {
        var account = _db.AddAccount(_me.Id);
        account.AddBalance(balance);
        _db.SaveChanges();
        _db.ChangeTracker.Clear();
        return account;
    }

    [Fact]
    public async Task A_lost_balance_update_is_detected_and_the_command_runs_again_on_fresh_data()
    {
        var account = AddAccount(1000);
        var (mediator, _) = Build(_db);
        _probe.Concurrent = 500;

        var balance = await mediator.Send(new DepositCommand(account.Id, 200));

        Assert.Equal(2, _probe.Attempts);
        Assert.Equal(1200, balance);
        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Information && e.Message.Contains("DepositCommand"));
        _db.ChangeTracker.Clear();
        Assert.Equal(1200, _db.Accounts.Single().BalanceCents);
    }

    [Fact]
    public async Task Two_stale_copies_of_an_account_cannot_both_be_saved()
    {
        var account = AddAccount(1000);
        using var other = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);
        var first = await new AccountRepository(_db).GetByIdAsync(account.Id);
        var second = await new AccountRepository(other).GetByIdAsync(account.Id);

        first!.AddBalance(100);
        await new AccountRepository(_db).UpdateAsync(first);
        second!.AddBalance(100);

        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => new AccountRepository(other).UpdateAsync(second));
    }

    [Fact]
    public async Task Updating_a_tracked_entity_only_writes_what_changed()
    {
        var category = _db.AddCategory(_me.Id, "Lazer");
        _db.ChangeTracker.Clear();
        using var other = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);
        var mine = await new CategoryRepository(_db).GetByIdAsync(category.Id);
        var theirs = await new CategoryRepository(other).GetByIdAsync(category.Id);

        theirs!.Color = "#FF0000";
        await new CategoryRepository(other).UpdateAsync(theirs);
        mine!.Name = "Diversão";
        await new CategoryRepository(_db).UpdateAsync(mine);

        _db.ChangeTracker.Clear();
        var saved = _db.Categories.Single(c => c.Id == category.Id);
        Assert.Equal(("Diversão", "#FF0000"), (saved.Name, saved.Color));
    }

    [Fact]
    public async Task Detached_entities_are_still_updated()
    {
        var category = _db.AddCategory(_me.Id, "Lazer");
        _db.ChangeTracker.Clear();

        category.Name = "Diversão";
        await new CategoryRepository(_db).UpdateAsync(category);

        _db.ChangeTracker.Clear();
        Assert.Equal("Diversão", _db.Categories.Single(c => c.Id == category.Id).Name);
    }

    [Fact]
    public async Task Work_registered_for_after_the_commit_runs_only_once_everything_is_saved()
    {
        var (mediator, _) = Build(_db);

        await mediator.Send(new OuterCommand(Fail: false));

        Assert.Equal(["inner saved: True", "outer saved: True"], _probe.AfterCommit);
        Assert.Null(_db.Database.CurrentTransaction);
    }

    [Fact]
    public async Task Work_registered_by_a_failed_command_is_discarded()
    {
        var (mediator, work) = Build(_db);

        await Assert.ThrowsAsync<BusinessRuleException>(() => mediator.Send(new OuterCommand(Fail: true)));

        Assert.Empty(_probe.AfterCommit);
        Assert.Equal(0, work.Pending);
    }

    [Fact]
    public async Task A_failing_after_commit_action_is_logged_without_failing_the_request()
    {
        var (mediator, _) = Build(_db);

        Assert.True(await mediator.Send(new AfterCommitCommand(Throw: true)));

        Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Warning && e.Exception is InvalidOperationException);
    }

    [Fact]
    public async Task Repeated_conflicts_become_a_conflict_error_after_a_few_attempts()
    {
        var (mediator, work) = Build(_db);

        var error = await Assert.ThrowsAsync<ConflictException>(() => mediator.Send(new AlwaysConflictCommand()));

        Assert.Equal(Mediator.ConflictMessage, error.Message);
        Assert.Equal(Mediator.MaxAttempts, _probe.Attempts);
        Assert.Equal(0, work.Pending);
    }

    [Fact]
    public async Task A_duplicate_insert_from_a_concurrent_request_is_retried_until_it_finds_the_row()
    {
        var (mediator, _) = Build(_db);

        Assert.Equal(2, await mediator.Send(new DuplicateOnceQuery()));
    }

    [Fact]
    public async Task Without_a_transaction_to_roll_back_a_conflict_is_reported_instead_of_retried()
    {
        using var memory = TestDb.InMemory();
        var (mediator, _) = Build(memory);

        await Assert.ThrowsAsync<ConflictException>(() => mediator.Send(new AlwaysConflictCommand()));

        Assert.Equal(1, _probe.Attempts);
    }

    [Fact]
    public async Task Commands_marked_to_run_outside_a_transaction_do_not_hold_one()
    {
        var (mediator, _) = Build(_db);

        Assert.True(await mediator.Send(new OutsideCommand()));

        Assert.Equal([false], _probe.InTransaction);
    }

    [Fact]
    public async Task Without_a_registered_unit_of_work_the_mediator_uses_its_own()
    {
        var services = new ServiceCollection();
        services.AddSingleton(_db);
        services.AddSingleton(_probe);
        services.AddScoped<IRequestHandler<OutsideCommand, bool>, OutsideHandler>();

        Assert.True(await new Mediator(services.BuildServiceProvider()).Send(new OutsideCommand()));
    }

    public sealed class Probe
    {
        public int Attempts { get; set; }
        public long Concurrent { get; set; }
        public List<string> AfterCommit { get; } = [];
        public List<bool> InTransaction { get; } = [];
    }

    public record DepositCommand(Guid AccountId, long Cents) : ICommand<long>;

    public sealed class DepositHandler(AppDbContext db, Probe probe) : IRequestHandler<DepositCommand, long>
    {
        public async Task<long> Handle(DepositCommand request, CancellationToken cancellationToken = default)
        {
            probe.Attempts++;
            var repository = new AccountRepository(db);
            var account = (await repository.GetByIdAsync(request.AccountId))!;
            if (probe.Attempts == 1 && probe.Concurrent > 0)
                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE Accounts SET BalanceCents = BalanceCents + {0}, Version = {1} WHERE Id = {2}",
                    [probe.Concurrent, Guid.NewGuid(), request.AccountId], cancellationToken);
            account.AddBalance(request.Cents);
            await repository.UpdateAsync(account);
            return account.BalanceCents;
        }
    }

    public record AfterCommitCommand(bool Throw) : ICommand<bool>;

    public sealed class AfterCommitHandler(AppDbContext db, Probe probe, IUnitOfWork work) : IRequestHandler<AfterCommitCommand, bool>
    {
        public async Task<bool> Handle(AfterCommitCommand request, CancellationToken cancellationToken = default)
        {
            db.Users.Add(new User { Name = "Inner", Email = $"{Guid.NewGuid():N}@x.com", GoogleId = Guid.NewGuid().ToString("N") });
            await db.SaveChangesAsync(cancellationToken);
            work.OnCommitted(() =>
            {
                if (request.Throw) throw new InvalidOperationException("storage down");
                probe.AfterCommit.Add($"inner saved: {db.Database.CurrentTransaction == null}");
                return Task.CompletedTask;
            });
            return true;
        }
    }

    public record OuterCommand(bool Fail) : ICommand<bool>;

    public sealed class OuterHandler(AppDbContext db, Probe probe, IUnitOfWork work, IServiceProvider services) : IRequestHandler<OuterCommand, bool>
    {
        public async Task<bool> Handle(OuterCommand request, CancellationToken cancellationToken = default)
        {
            await new Mediator(services).Send(new AfterCommitCommand(Throw: false), cancellationToken);
            work.OnCommitted(() =>
            {
                probe.AfterCommit.Add($"outer saved: {db.Database.CurrentTransaction == null}");
                return Task.CompletedTask;
            });
            if (request.Fail) throw new BusinessRuleException("falhou");
            return true;
        }
    }

    public record AlwaysConflictCommand : ICommand<bool>;

    public sealed class AlwaysConflictHandler(Probe probe, IUnitOfWork work) : IRequestHandler<AlwaysConflictCommand, bool>
    {
        public Task<bool> Handle(AlwaysConflictCommand request, CancellationToken cancellationToken = default)
        {
            probe.Attempts++;
            work.OnCommitted(() => Task.CompletedTask);
            throw new DbUpdateConcurrencyException("changed meanwhile");
        }
    }

    public record DuplicateOnceQuery : IQuery<int>;

    public sealed class DuplicateOnceHandler(Probe probe) : IRequestHandler<DuplicateOnceQuery, int>
    {
        public Task<int> Handle(DuplicateOnceQuery request, CancellationToken cancellationToken = default)
        {
            probe.Attempts++;
            if (probe.Attempts == 1) throw new DbUpdateException("duplicate", new SqliteException("UNIQUE constraint failed: Folders.UserId", 19));
            return Task.FromResult(probe.Attempts);
        }
    }

    public record OutsideCommand : ICommand<bool>, IRunsOutsideTransaction;

    public sealed class OutsideHandler(AppDbContext db, Probe probe) : IRequestHandler<OutsideCommand, bool>
    {
        public Task<bool> Handle(OutsideCommand request, CancellationToken cancellationToken = default)
        {
            probe.InTransaction.Add(db.Database.CurrentTransaction != null);
            return Task.FromResult(true);
        }
    }
}

public class DbErrorsTests
{
    [Fact]
    public void Unique_violations_are_recognised_for_postgres_and_sqlite()
    {
        Assert.True(DbErrors.IsUniqueViolation(new DbUpdateException("x", new SqliteException("UNIQUE constraint failed: X.Y", 19))));
        Assert.True(DbErrors.IsUniqueViolation(new DbUpdateException("x", new Npgsql.PostgresException("duplicate", "ERROR", "ERROR", DbErrors.UniqueViolationState))));
        Assert.False(DbErrors.IsUniqueViolation(new DbUpdateException("x", new SqliteException("FOREIGN KEY constraint failed", 19))));
        Assert.False(DbErrors.IsUniqueViolation(new DbUpdateException("x")));
        Assert.False(DbErrors.IsUniqueViolation(new InvalidOperationException()));
    }
}

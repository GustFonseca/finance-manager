using AutoMapper;
using FinanceManager.Aplication;
using FinanceManager.Aplication.Auth;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Aplication.UseCases.Accounts.Commands.CreateAccount;
using FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure;
using FinanceManager.Infrastructure.Auth;
using FinanceManager.Infrastructure.Classification;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Messaging;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Tests.Infrastructure;

public class DependencyInjectionTests
{
    private static readonly IConfiguration Config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=finance;Username=test;Password=test",
            ["Supabase:Url"] = "https://projeto.supabase.co",
            ["Supabase:SecretKey"] = "sb_secret_test",
            ["Google:ClientId"] = "client-id",
            ["Jwt:Secret"] = "uma-chave-de-teste-com-mais-de-32-bytes!!",
        })
        .Build();

    private static ServiceProvider BuildApp()
    {
        var services = new ServiceCollection();
        services.AddSingleton(Config);
        services.AddLogging();
        services.AddApplication();
        services.AddInfrastructure(Config);
        return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
    }

    private static IEnumerable<Type> HandlerInterfaces(Type type) => type.GetInterfaces()
        .Where(i => i.IsGenericType &&
                    (i.GetGenericTypeDefinition() == typeof(IRequestHandler<>) ||
                     i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>)));

    [Fact]
    public void AddApplication_registers_every_handler_as_scoped_and_a_valid_mapper()
    {
        var services = new ServiceCollection().AddApplication();

        var handlers = typeof(CreateAccountHandler).Assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .SelectMany(t => HandlerInterfaces(t).Select(i => (Interface: i, Implementation: t)))
            .ToList();

        Assert.True(handlers.Count > 40);
        Assert.All(handlers, h => Assert.Contains(services, d =>
            d.ServiceType == h.Interface && d.ImplementationType == h.Implementation && d.Lifetime == ServiceLifetime.Scoped));
        using var provider = services.BuildServiceProvider();
        provider.GetRequiredService<IMapper>().ConfigurationProvider.AssertConfigurationIsValid();
    }

    [Fact]
    public void AddInfrastructure_wires_the_database_repositories_and_services()
    {
        using var app = BuildApp();
        using var scope = app.CreateScope();
        var services = scope.ServiceProvider;

        var db = services.GetRequiredService<AppDbContext>();
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", db.Database.ProviderName);
        Assert.IsType<Mediator>(services.GetRequiredService<IMediator>());
        Assert.IsType<Repository<Account>>(services.GetRequiredService<IRepository<Account>>());
        Assert.IsType<AccountRepository>(services.GetRequiredService<IAccountRepository>());
        Assert.IsType<UserRepository>(services.GetRequiredService<IUserRepository>());
        Assert.IsType<TransactionRepository>(services.GetRequiredService<ITransactionRepository>());
        Assert.IsType<CategoryRepository>(services.GetRequiredService<ICategoryRepository>());
        Assert.IsType<GoalRepository>(services.GetRequiredService<IGoalRepository>());
        Assert.IsType<FolderRepository>(services.GetRequiredService<IFolderRepository>());
        Assert.IsType<StoredFileRepository>(services.GetRequiredService<IStoredFileRepository>());
        Assert.IsType<ActivityLogRepository>(services.GetRequiredService<IActivityLogRepository>());
        Assert.IsType<SavingsPlanRepository>(services.GetRequiredService<ISavingsPlanRepository>());
        Assert.IsType<CategoryBudgetRepository>(services.GetRequiredService<ICategoryBudgetRepository>());
        Assert.IsType<MerchantRepository>(services.GetRequiredService<IMerchantRepository>());
        Assert.IsType<ClassificationRuleRepository>(services.GetRequiredService<IClassificationRuleRepository>());
        Assert.IsType<SupabaseFileStorage>(services.GetRequiredService<IFileStorage>());
        Assert.IsType<GoogleTokenValidator>(services.GetRequiredService<IGoogleTokenValidator>());
        Assert.IsType<ClassificationRulesProvider>(services.GetRequiredService<IClassificationRulesProvider>());
        Assert.Same(app.GetRequiredService<IClassificationRulesProvider>(), services.GetRequiredService<IClassificationRulesProvider>());
    }

    [Fact]
    public void Every_handler_resolves_in_the_composed_application()
    {
        using var app = BuildApp();
        using var scope = app.CreateScope();

        var handlers = typeof(DeleteTransactionHandler).Assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .SelectMany(HandlerInterfaces)
            .ToList();

        Assert.All(handlers, h => Assert.NotNull(scope.ServiceProvider.GetRequiredService(h)));
    }
}

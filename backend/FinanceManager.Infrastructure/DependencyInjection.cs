using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Messaging;
using FinanceManager.Aplication.Storage;
using FinanceManager.Infrastructure.Storage;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Aplication.Classification;
using FinanceManager.Infrastructure.Classification;
using FinanceManager.Aplication.Rates;
using FinanceManager.Infrastructure.Rates;
using FinanceManager.Aplication.Companies;
using FinanceManager.Infrastructure.Companies;
using FinanceManager.Aplication.Auth;
using FinanceManager.Infrastructure.Auth;
using FinanceManager.Aplication.Caching;
using FinanceManager.Infrastructure.Caching;

namespace FinanceManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .AddInterceptors(new ActivityLogInterceptor()));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        services.AddScoped<UnitOfWork>();
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<UnitOfWork>());
        services.AddScoped<IMediator, Mediator>();

        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IGoalRepository, GoalRepository>();
        services.AddScoped<IFolderRepository, FolderRepository>();
        services.AddScoped<IStoredFileRepository, StoredFileRepository>();
        services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
        services.AddScoped<ISavingsPlanRepository, SavingsPlanRepository>();
        services.AddScoped<IChallengeRepository, ChallengeRepository>();
        services.AddScoped<IInsightDismissalRepository, InsightDismissalRepository>();
        services.AddScoped<ISubscriptionDecisionRepository, SubscriptionDecisionRepository>();
        services.AddSingleton<IAdminDirectory, ConfigAdminDirectory>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IDebtRepository, DebtRepository>();
        services.AddScoped<ICategoryBudgetRepository, CategoryBudgetRepository>();
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<IClassificationRuleRepository, ClassificationRuleRepository>();

        services.AddMemoryCache();
        services.AddSingleton<IClassificationRulesProvider, ClassificationRulesProvider>();
        services.AddSingleton<UserDataVersions>();
        services.AddSingleton<IUserDataVersions>(sp => sp.GetRequiredService<UserDataVersions>());

        services.AddHttpClient<IFileStorage, SupabaseFileStorage>();
        services.AddHttpClient<IInterestRateProvider, BcbInterestRateProvider>(client => client.Timeout = TimeSpan.FromSeconds(3));
        services.AddHttpClient<ICompanyRegistry, BrasilApiCompanyRegistry>(client => client.Timeout = TimeSpan.FromSeconds(10));
        if (configuration.GetValue("Enrichment:Enabled", true)) services.AddHostedService<MerchantEnrichmentService>();

        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();

        return services;
    }
}

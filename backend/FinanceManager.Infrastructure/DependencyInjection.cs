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

namespace FinanceManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .AddInterceptors(new ActivityLogInterceptor()));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

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
        services.AddScoped<ICategoryBudgetRepository, CategoryBudgetRepository>();
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<IClassificationRuleRepository, ClassificationRuleRepository>();

        services.AddMemoryCache();
        services.AddSingleton<IClassificationRulesProvider, ClassificationRulesProvider>();

        services.AddHttpClient<IFileStorage, SupabaseFileStorage>();

        return services;
    }
}

using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Messaging.Pipeline;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Infrastructure.Messaging;

public static class MessagingServices
{
    public static IServiceCollection AddMessaging(this IServiceCollection services)
    {
        services.AddScoped<RequestNesting>();
        services.AddScoped<DomainEventDispatcher>();
        services.AddScoped<IRequestBehavior, ConflictRetryBehavior>();
        services.AddScoped<IRequestBehavior, DomainEventsBehavior>();
        services.AddScoped<IRequestBehavior, TransactionBehavior>();
        services.AddScoped<IMediator, Mediator>();
        return services;
    }
}

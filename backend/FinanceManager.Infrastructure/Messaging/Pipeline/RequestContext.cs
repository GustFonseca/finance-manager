using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Messaging.Pipeline;

public sealed record RequestContext(object Request, bool IsCommand, bool OwnsTransaction)
{
    public string Name => Request.GetType().Name;

    public static RequestContext For(object request, AppDbContext db)
    {
        var interfaces = request.GetType().GetInterfaces();
        var isCommand = interfaces.Any(i => i == typeof(ICommand) || (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>)));
        var ownsTransaction = isCommand
            && !interfaces.Contains(typeof(IRunsOutsideTransaction))
            && db.Database.IsRelational()
            && db.Database.CurrentTransaction == null;
        return new RequestContext(request, isCommand, ownsTransaction);
    }
}

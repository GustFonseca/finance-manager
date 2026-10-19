using FinanceManager.Aplication.Mediator.Messaging;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Messaging;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly List<Func<Task>> _committed = [];

    public int Depth { get; internal set; }

    public int Pending => _committed.Count;

    public void OnCommitted(Func<Task> action) => _committed.Add(action);

    public void Discard() => _committed.Clear();

    public async Task FlushAsync(ILogger? logger = null)
    {
        var actions = _committed.ToList();
        _committed.Clear();
        foreach (var action in actions)
        {
            try
            {
                await action();
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "An action after the commit failed");
            }
        }
    }
}

using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

/// <summary>One entry of a user's activity history ("Visualizar eventos").</summary>
public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ActivityType Type { get; set; } = ActivityType.INFO;
    /// <summary>Area of the app, e.g. "Transações", "Arquivos".</summary>
    public string Source { get; set; } = string.Empty;
    /// <summary>Human-readable, in Portuguese: "Transação criada: Mercado (- R$ 45,90)".</summary>
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

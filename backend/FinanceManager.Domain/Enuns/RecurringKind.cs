namespace FinanceManager.Domain.Enuns;

/// <summary>How a recurring expense is shown on the Painel.</summary>
public enum RecurringKind
{
    /// <summary>Streaming, apps, gym… (recognized by the merchant).</summary>
    SUBSCRIPTION,
    /// <summary>Any other charge that repeats every month (rent, bills, internet…).</summary>
    FIXED
}

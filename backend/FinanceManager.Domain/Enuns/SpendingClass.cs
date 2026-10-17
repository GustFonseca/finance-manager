namespace FinanceManager.Domain.Enuns;

/// <summary>How necessary an expense is, for the spending analysis.</summary>
public enum SpendingClass
{
    /// <summary>Housing, bills, health, education: hard to cut.</summary>
    ESSENTIAL,
    /// <summary>Needed, but the amount can be managed: groceries, fuel, pharmacy, transport.</summary>
    VARIABLE,
    /// <summary>Delivery, eating out, entertainment, shopping, subscriptions: can be reduced.</summary>
    SUPERFLUOUS
}

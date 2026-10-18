namespace FinanceManager.Domain.Enuns;

/// <summary>Who is on the other side of a transaction.</summary>
public enum MerchantKind
{
    /// <summary>A company, shop or service.</summary>
    BUSINESS,
    /// <summary>Another person (a Pix to a friend, a relative…).</summary>
    PERSON,
    /// <summary>The user's own money moving: investments, the card bill, their own accounts elsewhere.</summary>
    OWN
}

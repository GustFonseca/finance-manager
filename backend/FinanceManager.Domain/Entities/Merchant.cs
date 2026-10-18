using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Entities;

/// <summary>
/// Where a transaction's money went (or came from): "iFood", "Panificadora Nossa
/// Mania", a person. Created automatically from the descriptions, so the same
/// place is grouped however the bank wrote it.
/// </summary>
public class Merchant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>Normalized name, unique per user: how descriptions are matched to the merchant.</summary>
    public string Key { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    /// <summary>CNPJ, or the masked CPF the bank shows, when the statement has one.</summary>
    public string? Document { get; set; }
    /// <summary>The category the user files it under; suggested for new transactions.</summary>
    public Guid? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = [];
}

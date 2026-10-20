using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Entities;

public class Folder : IOwned, ISoftDeletable
{
    public const string ImportsFolderName = "Extratos importados";

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSystem { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<StoredFile> Files { get; set; } = [];
}

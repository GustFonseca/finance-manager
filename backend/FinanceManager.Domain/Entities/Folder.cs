namespace FinanceManager.Domain.Entities;

public class Folder
{
    /// <summary>Name of the default folder that receives every imported statement.</summary>
    public const string ImportsFolderName = "Extratos importados";

    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>The default imports folder: it can't be renamed or deleted.</summary>
    public bool IsSystem { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>Set while the folder is in the trash.</summary>
    public DateTime? DeletedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<StoredFile> Files { get; set; } = [];
}

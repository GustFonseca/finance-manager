namespace FinanceManager.Aplication.DTOs;

public class FolderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSystem { get; set; }
    public int FileCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TrashFolderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FileCount { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class FolderNameRequest
{
    public string Name { get; set; } = string.Empty;
}

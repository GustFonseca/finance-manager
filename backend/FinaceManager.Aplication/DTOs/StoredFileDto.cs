namespace FinanceManager.Aplication.DTOs;

public class StoredFileDto
{
    public Guid Id { get; set; }
    public Guid FolderId { get; set; }
    public string? FolderName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class TrashDto
{
    public List<TrashFolderDto> Folders { get; set; } = [];
    public List<StoredFileDto> Files { get; set; } = [];
}

public class FileDownloadDto
{
    public string Url { get; set; } = string.Empty;
}

public class FileViewDto
{
    public string Url { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public class UpdateFileRequest
{
    public string? Name { get; set; }
    public Guid? FolderId { get; set; }
}

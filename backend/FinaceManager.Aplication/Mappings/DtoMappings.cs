using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Mappings;

public static class DtoMappings
{
    public static AccountDto ToDto(this Account account) => new()
    {
        Id = account.Id,
        Name = account.Name,
        BalanceCents = account.BalanceCents,
        CreatedAt = account.CreatedAt,
    };

    public static ActivityLogDto ToDto(this ActivityLog log) => new()
    {
        Id = log.Id,
        Type = log.Type,
        Source = log.Source,
        Description = log.Description,
        CreatedAt = log.CreatedAt,
    };

    public static CategoryDto ToDto(this Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Type = category.Type,
        Color = category.Color,
    };

    public static FolderDto ToDto(this Folder folder) => new()
    {
        Id = folder.Id,
        Name = folder.Name,
        IsSystem = folder.IsSystem,
        CreatedAt = folder.CreatedAt,
    };

    public static TrashFolderDto ToTrashDto(this Folder folder) => new()
    {
        Id = folder.Id,
        Name = folder.Name,
        DeletedAt = folder.DeletedAt,
    };

    public static GoalDto ToDto(this Goal goal) => new()
    {
        Id = goal.Id,
        Name = goal.Name,
        TargetCents = goal.TargetCents,
        CurrentCents = goal.CurrentCents,
        Deadline = goal.Deadline,
        Status = goal.Status,
        ProgressPercent = goal.ProgressPercent,
    };

    public static MerchantDto ToDto(this Merchant merchant) => new()
    {
        Id = merchant.Id,
        Name = merchant.Name,
        Kind = merchant.Kind,
        Document = merchant.Document,
        CategoryId = merchant.CategoryId,
        CategoryName = merchant.Category?.Name ?? string.Empty,
        Class = merchant.Class,
        Activity = merchant.Activity,
    };

    public static StoredFileDto ToDto(this StoredFile file) => new()
    {
        Id = file.Id,
        FolderId = file.FolderId,
        Name = file.Name,
        ContentType = file.ContentType,
        SizeBytes = file.SizeBytes,
        CreatedAt = file.CreatedAt,
        DeletedAt = file.DeletedAt,
    };

    public static TransactionDto ToDto(this Transaction transaction) => new()
    {
        Id = transaction.Id,
        AccountId = transaction.AccountId,
        AccountName = transaction.Account?.Name ?? string.Empty,
        CategoryId = transaction.CategoryId,
        CategoryName = transaction.Category?.Name ?? string.Empty,
        Type = transaction.Type,
        AmountCents = transaction.AmountCents,
        Description = transaction.Description,
        Date = transaction.Date,
        Recurrence = transaction.Recurrence,
        MerchantId = transaction.MerchantId,
        MerchantName = transaction.Merchant?.Name ?? string.Empty,
        ReceiptFileId = transaction.ReceiptFileId,
    };
}

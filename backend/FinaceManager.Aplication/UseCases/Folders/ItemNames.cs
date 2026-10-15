namespace FinanceManager.Aplication.UseCases.Folders;

/// <summary>Validation shared by folder and file names.</summary>
public static class ItemNames
{
    private static readonly char[] Invalid = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

    /// <summary>Trims the name and rejects what Windows wouldn't accept either.</summary>
    public static string Validate(string? name, int maxLength)
    {
        var trimmed = (name ?? string.Empty).Trim();
        if (trimmed.Length == 0)
            throw new InvalidOperationException("O nome não pode ficar em branco.");
        if (trimmed.Length > maxLength)
            throw new InvalidOperationException($"O nome pode ter no máximo {maxLength} caracteres.");
        if (trimmed.IndexOfAny(Invalid) >= 0)
            throw new InvalidOperationException("O nome não pode conter os caracteres \\ / : * ? \" < > |");
        return trimmed;
    }
}

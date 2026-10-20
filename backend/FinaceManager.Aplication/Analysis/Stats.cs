namespace FinanceManager.Aplication.Analysis;

public static class Stats
{
    public static long Median(IReadOnlyList<long> values)
    {
        if (values.Count == 0) return 0;
        var sorted = values.Order().ToList();
        var middle = sorted.Count / 2;
        return sorted.Count % 2 == 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }
}

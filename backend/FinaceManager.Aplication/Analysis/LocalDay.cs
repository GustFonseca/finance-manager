namespace FinanceManager.Aplication.Analysis;

public static class LocalDay
{
    public static DateTime Start(DateTime monthStart, DateTime instant) =>
        monthStart.AddDays(Math.Floor((instant - monthStart).TotalDays));

    public static DateTime Next(DateTime monthStart, DateTime instant) => Start(monthStart, instant).AddDays(1);

    public static DateTime EndOfDay(DateTime monthStart, DateTime instant) => Next(monthStart, instant).AddMilliseconds(-1);

    public static TimeSpan Offset(DateTime monthStart)
    {
        var date = monthStart.Date;
        var localFirstDay = monthStart.Day != 1 && date.AddDays(1).Day == 1 ? date.AddDays(1) : date;
        return localFirstDay - monthStart;
    }
}

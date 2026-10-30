namespace Backend;

/// <summary>Pure statistics over an ordered series of prices. No I/O.</summary>
public static class StatsCalculator
{
    /// <summary>(last / first - 1) * 100. Zero for fewer than two prices.</summary>
    public static double TotalReturnPct(IReadOnlyList<double> p)
    {
        if (p.Count < 2 || p[0] == 0) return 0.0;
        return (p[^1] / p[0] - 1) * 100;
    }

    /// <summary>Sample stdev (n-1) of simple daily returns, as a percent. Not annualized.</summary>
    public static double DailyVolatility(IReadOnlyList<double> p)
    {
        int n = p.Count - 1; // number of returns
        if (n < 2) return 0.0;

        var returns = new double[n];
        for (int i = 1; i < p.Count; i++)
            returns[i - 1] = p[i] / p[i - 1] - 1;

        double mean = returns.Average();
        double sumSq = returns.Sum(r => (r - mean) * (r - mean));
        return Math.Sqrt(sumSq / (n - 1)) * 100;
    }

    /// <summary>Most negative (price / running peak - 1) * 100. Zero if prices never fall.</summary>
    public static double MaxDrawdownPct(IReadOnlyList<double> p)
    {
        if (p.Count < 2) return 0.0;

        double peak = p[0];
        double worst = 0.0;
        foreach (var price in p)
        {
            if (price > peak) peak = price;
            double drawdown = price / peak - 1;
            if (drawdown < worst) worst = drawdown;
        }
        return worst * 100;
    }
}

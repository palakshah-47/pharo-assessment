using Backend;
using Xunit;

namespace Backend.Tests;

public class StatsCalculatorTests
{
    [Fact]
    public void TotalReturn_100To110_Is10()
    {
        Assert.Equal(10.0, StatsCalculator.TotalReturnPct(new double[] { 100, 110 }), 6);
    }

    [Fact]
    public void Volatility_KnownSeries()
    {
        // returns: +0.10, -0.10 -> sample stdev 0.141421 -> 14.1421 %
        Assert.Equal(14.1421, StatsCalculator.DailyVolatility(new double[] { 100, 110, 99 }), 3);
    }

    [Fact]
    public void MaxDrawdown_PeakThenTrough()
    {
        Assert.Equal(-25.0, StatsCalculator.MaxDrawdownPct(new double[] { 100, 120, 90, 110 }), 6);
    }

    [Fact]
    public void MaxDrawdown_MonotoneUp_IsZero()
    {
        Assert.Equal(0.0, StatsCalculator.MaxDrawdownPct(new double[] { 1, 2, 3 }), 6);
    }

    [Fact]
    public void FlatSeries_VolAndDrawdownAreZero()
    {
        var flat = new double[] { 50, 50, 50 };
        var vol = StatsCalculator.DailyVolatility(flat);
        var dd = StatsCalculator.MaxDrawdownPct(flat);
        Assert.False(double.IsNaN(vol));
        Assert.False(double.IsNaN(dd));
        Assert.Equal(0.0, vol, 6);
        Assert.Equal(0.0, dd, 6);
    }

    [Fact]
    public void SinglePoint_AllZero_NoNaN()
    {
        var one = new double[] { 42 };
        Assert.Equal(0.0, StatsCalculator.TotalReturnPct(one), 6);
        Assert.Equal(0.0, StatsCalculator.DailyVolatility(one), 6);
        Assert.Equal(0.0, StatsCalculator.MaxDrawdownPct(one), 6);
    }
}

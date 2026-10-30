using Backend;
using Xunit;

namespace Backend.Tests;

public class PriceStoreTests : IDisposable
{
    private readonly string _dir = Directory.CreateTempSubdirectory().FullName;

    public void Dispose() => Directory.Delete(_dir, recursive: true);

    private string WriteCsv(string content)
    {
        var path = Path.Combine(_dir, "data.csv");
        File.WriteAllText(path, content);
        return path;
    }

    [Fact]
    public void LoadsFromTempCsv_SortsByDate()
    {
        var path = WriteCsv(
            "date,ticker,price\n" +
            "2026-01-03,AAA,30.5\n" +
            "2026-01-01,AAA,10.5\n" +
            "2026-01-02,AAA,20.5\n" +
            "2026-01-01,BBB,5\n");

        var store = PriceStore.LoadFromCsv(path);

        Assert.Equal(new[] { "AAA", "BBB" }, store.Tickers);
        Assert.True(store.TryGet("AAA", out var series));
        Assert.Equal(new[] { "2026-01-01", "2026-01-02", "2026-01-03" }, series.Select(p => p.Date));
        Assert.Equal(new[] { 10.5, 20.5, 30.5 }, series.Select(p => p.Price));
    }

    [Fact]
    public void MissingFile_ThrowsFileNotFoundWithPath()
    {
        var path = Path.Combine(_dir, "nope.csv");

        var ex = Assert.Throws<FileNotFoundException>(() => PriceStore.LoadFromCsv(path));

        Assert.Contains(path, ex.Message);
    }

    [Fact]
    public void MalformedRow_ThrowsFormatExceptionWithLineNumber()
    {
        var path = WriteCsv("date,ticker,price\n2026-01-01,AAA,abc\n");

        var ex = Assert.Throws<FormatException>(() => PriceStore.LoadFromCsv(path));

        Assert.Contains("line 2", ex.Message);
    }

    [Fact]
    public void TryGet_IsCaseInsensitive()
    {
        var store = PriceStore.LoadFromCsv(WriteCsv("date,ticker,price\n2026-01-01,TICK0001,1\n"));

        Assert.True(store.TryGet("tick0001", out _));
        Assert.True(store.TryGet("TICK0001", out _));
        Assert.False(store.TryGet("TICK9999", out _));
    }
}

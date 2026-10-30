using System.Globalization;

namespace Backend;

/// <summary>In-memory price series keyed by ticker (case-insensitive), loaded once from CSV.</summary>
public sealed class PriceStore
{
    private readonly Dictionary<string, (string Canonical, List<PricePoint> Series)> _data;

    private PriceStore(Dictionary<string, (string, List<PricePoint>)> data)
    {
        _data = data;
        Tickers = data.Values.Select(v => v.Item1).OrderBy(t => t, StringComparer.Ordinal).ToList();
    }

    /// <summary>All tickers, sorted ordinally.</summary>
    public IReadOnlyList<string> Tickers { get; }

    /// <summary>Loads "date,ticker,price" rows. Series are sorted ascending by date.</summary>
    public static PriceStore LoadFromCsv(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"Price data file not found: {path}", path);

        var data = new Dictionary<string, (string, List<PricePoint>)>(StringComparer.OrdinalIgnoreCase);
        int lineNo = 0;
        foreach (var line in File.ReadLines(path))
        {
            lineNo++;
            if (lineNo == 1 || string.IsNullOrWhiteSpace(line)) continue; // header / blank

            var parts = line.Split(',');
            if (parts.Length != 3
                || string.IsNullOrWhiteSpace(parts[0])
                || string.IsNullOrWhiteSpace(parts[1])
                || !double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var price))
            {
                throw new FormatException($"Malformed row at line {lineNo} of {path}: '{line}'");
            }

            var ticker = parts[1].Trim();
            if (!data.TryGetValue(ticker, out var entry))
            {
                entry = (ticker, new List<PricePoint>());
                data[ticker] = entry;
            }
            entry.Item2.Add(new PricePoint(parts[0].Trim(), price));
        }

        foreach (var entry in data.Values)
            entry.Item2.Sort((a, b) => string.CompareOrdinal(a.Date, b.Date)); // ISO dates sort lexically

        return new PriceStore(data);
    }

    /// <summary>Case-insensitive lookup; also returns the ticker's canonical spelling.</summary>
    public bool TryGet(string ticker, out string canonicalTicker, out IReadOnlyList<PricePoint> series)
    {
        if (_data.TryGetValue(ticker, out var entry))
        {
            canonicalTicker = entry.Canonical;
            series = entry.Series;
            return true;
        }
        canonicalTicker = "";
        series = Array.Empty<PricePoint>();
        return false;
    }

    public bool TryGet(string ticker, out IReadOnlyList<PricePoint> series) =>
        TryGet(ticker, out _, out series);

    /// <summary>Walks up from the app and working directories looking for data/market_data.csv.</summary>
    public static string? FindDefaultCsv()
    {
        foreach (var start in new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() })
        {
            for (var dir = new DirectoryInfo(start); dir != null; dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, "data", "market_data.csv");
                if (File.Exists(candidate)) return candidate;
            }
        }
        return null;
    }
}

using Backend;

var builder = WebApplication.CreateBuilder(args);

// Data:CsvPath overrides the default lookup of data/market_data.csv.
PriceStore store;
try
{
    var csvPath = builder.Configuration["Data:CsvPath"]
        ?? PriceStore.FindDefaultCsv()
        ?? throw new FileNotFoundException("Could not find data/market_data.csv. Set Data:CsvPath to its location.");
    store = PriceStore.LoadFromCsv(csvPath);
}
catch (Exception ex) when (ex is IOException or FormatException)
{
    Console.Error.WriteLine($"Startup failed: {ex.Message}");
    return 1;
}

builder.Services.AddSingleton(store);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

app.MapGet("/api/instruments", (PriceStore s) => s.Tickers);

app.MapGet("/api/prices/{ticker}", (string ticker, PriceStore s) =>
    s.TryGet(ticker, out var canonical, out var series)
        ? Results.Ok(new { ticker = canonical, prices = series })
        : Results.NotFound(new { message = $"Unknown ticker '{ticker}'" }));

app.MapGet("/api/prices/{ticker}/stats", (string ticker, PriceStore s) =>
{
    if (!s.TryGet(ticker, out var canonical, out var series))
        return Results.NotFound(new { message = $"Unknown ticker '{ticker}'" });

    var prices = series.Select(p => p.Price).ToList();
    return Results.Ok(new Stats(
        canonical,
        StatsCalculator.TotalReturnPct(prices),
        StatsCalculator.DailyVolatility(prices),
        StatsCalculator.MaxDrawdownPct(prices)));
});

app.Run();
return 0;

// Exposed so tests can use WebApplicationFactory<Program>.
public partial class Program { }

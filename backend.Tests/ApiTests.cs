using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Backend.Tests;

public class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Instruments_Returns200Tickers()
    {
        var tickers = await _client.GetFromJsonAsync<string[]>("/api/instruments");

        Assert.NotNull(tickers);
        Assert.Equal(200, tickers!.Length);
        Assert.Equal("TICK0001", tickers[0]);
    }

    [Fact]
    public async Task Prices_LowercaseTicker_Returns30Points()
    {
        var resp = await _client.GetAsync("/api/prices/tick0001");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        Assert.Equal("TICK0001", doc.RootElement.GetProperty("ticker").GetString());
        var prices = doc.RootElement.GetProperty("prices");
        Assert.Equal(30, prices.GetArrayLength());
        Assert.Equal("2026-06-23", prices[0].GetProperty("date").GetString());
    }

    [Fact]
    public async Task Prices_Unknown_Returns404()
    {
        var resp = await _client.GetAsync("/api/prices/NOPE");

        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Stats_Unknown_Returns404()
    {
        var resp = await _client.GetAsync("/api/prices/NOPE/stats");

        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Stats_Known_HasThreeFiniteNumbers()
    {
        var stats = await _client.GetFromJsonAsync<Stats>("/api/prices/TICK0001/stats");

        Assert.NotNull(stats);
        Assert.Equal("TICK0001", stats!.Ticker);
        Assert.True(double.IsFinite(stats.TotalReturnPct));
        Assert.True(double.IsFinite(stats.DailyVolatility));
        Assert.True(double.IsFinite(stats.MaxDrawdownPct));
        Assert.True(stats.MaxDrawdownPct <= 0);
    }
}

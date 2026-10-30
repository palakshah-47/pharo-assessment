namespace Backend;

public record PricePoint(string Date, double Price);

public record Stats(string Ticker, double TotalReturnPct, double DailyVolatility, double MaxDrawdownPct);

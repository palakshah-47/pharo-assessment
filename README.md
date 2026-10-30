# Instrument Price Dashboard

A small full-stack app: browse 200 instruments, view a 30-day price chart with computed
statistics, and overlay 2–3 tickers to compare them. Runs locally; no database.

- **Backend:** C# / .NET 8 Minimal API, CSV loaded into memory at startup.
- **Frontend:** React + TypeScript (Vite), Recharts for charts, plain CSS.

## Run it

Prerequisites: [.NET 8 SDK](https://dotnet.microsoft.com/download) and Node.js 20+.

```bash
# terminal 1 — API on http://localhost:5080 (run from the repo root)
dotnet run --project backend

# terminal 2 — UI on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend, so no extra
configuration is needed. To point the API at a different CSV:
`dotnet run --project backend --Data:CsvPath=/path/to/market_data.csv`
(by default it finds `data/market_data.csv`).

## Tests

```bash
dotnet test backend.Tests       # StatsCalculator, PriceStore, and API endpoint tests
npm test --prefix frontend -- --run   # helpers + UI states (loading, error, 404, selection limit)
```

## API

| Method | Route                        | Returns                                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/api/instruments`           | Sorted list of all 200 tickers                                                |
| GET    | `/api/prices/{ticker}`       | `{ ticker, prices: [{ date, price }] }`, 30 days ascending; 404 if unknown    |
| GET    | `/api/prices/{ticker}/stats` | `{ ticker, totalReturnPct, dailyVolatility, maxDrawdownPct }`; 404 if unknown |

Ticker lookup is case-insensitive (`tick0001` works).

## Stats definitions

- **Total return %** = (last price / first price − 1) × 100.
- **Daily volatility** = _sample_ standard deviation (n − 1) of simple daily returns
  `p[t] / p[t−1] − 1` over the window (29 returns), shown as a percent. It is **not annualized**.
- **Max drawdown %** = the most negative value of `price / running peak − 1`, × 100. Reported as a
  negative number (0 if the price never falls below a prior peak).

Series with fewer than two prices (or two returns, for volatility) report 0 rather than NaN.

## UI notes

- Check one ticker for its price chart and stats. Check 2–3 to compare: the chart is
  **normalized to 100 on the first day** so tickers at different price levels are comparable, and
  the tooltip also shows the raw price. A 4th selection is blocked with a hint.
- Loading, "API unreachable" (with Retry), and "Ticker not found" states are handled.

## Layout

```
backend/        Program.cs (routes), PriceStore.cs (CSV load), StatsCalculator.cs (pure stats)
backend.Tests/  xUnit tests
frontend/src/   api.ts, useFetch.ts, lib.ts (filter/selection/normalize), components/, App.tsx
data/           market_data.csv
```

## Where AI helped

AI has helped me to build backend api with .Net application.


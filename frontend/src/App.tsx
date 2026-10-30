import { useState } from 'react'
import { api, ApiError, type Stats } from './api'
import { PriceChart, type ChartSeries } from './components/PriceChart'
import { StatsPanel } from './components/StatsPanel'
import { TickerList } from './components/TickerList'
import { MAX_SELECTED, toggleSelection } from './lib'
import { useFetch } from './useFetch'
import './App.css'

interface TickerData {
  series: ChartSeries
  stats: Stats
}

async function loadTicker(ticker: string): Promise<TickerData> {
  const [prices, stats] = await Promise.all([api.getPrices(ticker), api.getStats(ticker)])
  return { series: { ticker: prices.ticker, points: prices.prices }, stats }
}

function ErrorBanner({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const notFound = error instanceof ApiError && error.status === 404
  return (
    <div className="error" role="alert">
      <span>{notFound ? 'Ticker not found.' : error.message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState<string[]>([])
  const [limitHint, setLimitHint] = useState(false)

  const instruments = useFetch(api.getInstruments, [])
  const details = useFetch(
    () => Promise.all(selected.map(loadTicker)),
    [selected.join(',')],
  )

  function handleToggle(ticker: string) {
    const blocked = !selected.includes(ticker) && selected.length >= MAX_SELECTED
    setLimitHint(blocked)
    if (!blocked) setSelected(toggleSelection(selected, ticker))
  }

  const comparing = selected.length > 1
  // After a selection change there is one render where `details.data` still belongs to the
  // previous selection; only treat it as ready when it matches the current one.
  const ready =
    details.data !== null && details.data.map((d) => d.series.ticker).join(',') === selected.join(',')

  return (
    <div className="layout">
      <aside>
        <h1>Instruments</h1>
        {instruments.loading && <p className="muted">Loading instruments…</p>}
        {instruments.error && <ErrorBanner error={instruments.error} onRetry={instruments.retry} />}
        {instruments.data && (
          <TickerList tickers={instruments.data} selected={selected} onToggle={handleToggle} />
        )}
        {limitHint && <p className="hint">You can compare up to {MAX_SELECTED} tickers.</p>}
      </aside>

      <main>
        {selected.length === 0 ? (
          <p className="muted">Select a ticker to see its price chart and stats. Pick 2–3 to compare.</p>
        ) : details.error ? (
          <ErrorBanner error={details.error} onRetry={details.retry} />
        ) : details.loading || !ready || !details.data ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <h2>{comparing ? 'Comparison' : details.data[0].series.ticker}</h2>
            <PriceChart series={details.data.map((d) => d.series)} />
            <StatsPanel stats={details.data.map((d) => d.stats)} />
          </>
        )}
      </main>
    </div>
  )
}

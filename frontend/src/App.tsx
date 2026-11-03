import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { api, ApiError, type Stats } from './api'
import { PriceChart, type ChartSeries } from './components/PriceChart'
import { StatsPanel } from './components/StatsPanel'
import { TickerList } from './components/TickerList'
import { MAX_SELECTED, toggleSelection } from './lib'
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
  const instruments = useQuery({ queryKey: ['instruments'], queryFn: api.getInstruments })
  const detailQueries = useQueries({
    queries: selected.map((ticker) => ({
      queryKey: ['ticker', ticker],
      queryFn: () => loadTicker(ticker),
    })),
  })

  function handleToggle(ticker: string) {
    const blocked = !selected.includes(ticker) && selected.length >= MAX_SELECTED
    setLimitHint(blocked)
    if (!blocked) setSelected(toggleSelection(selected, ticker))
  }

  const comparing = selected.length > 1
  const detailError = detailQueries.find((query) => query.error)?.error
  const tickerDetails = detailQueries.flatMap((query) => (query.data ? [query.data] : []))
  const detailsLoading = detailQueries.some((query) => query.isPending)
  const retryDetails = () => {
    void Promise.all(
      detailQueries.filter((query) => query.isError).map((query) => query.refetch()),
    )
  }

  return (
    <div className="layout">
      <aside>
        <h1>Instruments</h1>
        {instruments.isPending && <p className="muted">Loading instruments…</p>}
        {instruments.error && (
          <ErrorBanner error={instruments.error} onRetry={() => void instruments.refetch()} />
        )}
        {instruments.data && (
          <TickerList tickers={instruments.data} selected={selected} onToggle={handleToggle} />
        )}
        {limitHint && <p className="hint">You can compare up to {MAX_SELECTED} tickers.</p>}
      </aside>

      <main>
        {selected.length === 0 ? (
          <p className="muted">Select a ticker to see its price chart and stats. Pick 2–3 to compare.</p>
        ) : detailError ? (
          <ErrorBanner error={detailError} onRetry={retryDetails} />
        ) : detailsLoading || tickerDetails.length !== selected.length ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <h2>{comparing ? 'Comparison' : tickerDetails[0].series.ticker}</h2>
            <PriceChart series={tickerDetails.map((detail) => detail.series)} />
            <StatsPanel stats={tickerDetails.map((detail) => detail.stats)} />
          </>
        )}
      </main>
    </div>
  )
}

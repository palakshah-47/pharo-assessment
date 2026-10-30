import { useState } from 'react'
import { filterTickers } from '../lib'

interface Props {
  tickers: string[]
  selected: string[]
  onToggle: (ticker: string) => void
}

export function TickerList({ tickers, selected, onToggle }: Props) {
  const [query, setQuery] = useState('')
  const visible = filterTickers(tickers, query)

  return (
    <div className="ticker-list">
      <label htmlFor="ticker-search" className="visually-hidden">
        Search tickers
      </label>
      <input
        id="ticker-search"
        type="search"
        placeholder={`Search ${tickers.length} tickers…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="muted">
        {visible.length} shown · {selected.length} selected
      </div>
      {visible.length === 0 ? (
        <p className="muted">No matching tickers</p>
      ) : (
        <ul>
          {visible.map((t) => (
            <li key={t}>
              <label>
                <input type="checkbox" checked={selected.includes(t)} onChange={() => onToggle(t)} />
                {t}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

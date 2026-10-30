import type { Stats } from '../api'

const pct = (v: number, signed = false) => `${signed && v > 0 ? '+' : ''}${v.toFixed(2)}%`

export function StatsPanel({ stats }: { stats: Stats[] }) {
  return (
    <table className="stats">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Total return</th>
          <th>Daily volatility</th>
          <th>Max drawdown</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((s) => (
          <tr key={s.ticker}>
            <td>{s.ticker}</td>
            <td>{pct(s.totalReturnPct, true)}</td>
            <td>{pct(s.dailyVolatility)}</td>
            <td>{pct(s.maxDrawdownPct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

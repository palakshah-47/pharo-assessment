import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { normalizeTo100, type PricePoint } from '../lib'

export interface ChartSeries {
  ticker: string
  points: PricePoint[]
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a']

type Row = Record<string, string | number>

/** One row per date: `<ticker>` holds the normalized value, `<ticker>__raw` the raw price. */
function mergeSeries(series: ChartSeries[]): Row[] {
  const rows = new Map<string, Row>()
  for (const s of series) {
    for (const p of normalizeTo100(s.points)) {
      const row = rows.get(p.date) ?? { date: p.date }
      row[s.ticker] = p.normalized
      row[`${s.ticker}__raw`] = p.price
      rows.set(p.date, row)
    }
  }
  return [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

export function PriceChart({ series }: { series: ChartSeries[] }) {
  const comparing = series.length > 1
  const data: Row[] = comparing
    ? mergeSeries(series)
    : series[0].points.map((p) => ({ date: p.date, [series[0].ticker]: p.price }))

  return (
    <div className="chart" role="img" aria-label={`Price chart for ${series.map((s) => s.ticker).join(', ')}`}>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={48}
          />
          <Tooltip
            formatter={(value, name, item) => {
              const v = Number(value)
              if (!comparing) return [v.toFixed(2), String(name)]
              const raw = (item?.payload as Row | undefined)?.[`${name}__raw`]
              return [`${v.toFixed(1)} (price ${Number(raw).toFixed(2)})`, String(name)]
            }}
          />
          {comparing && <Legend />}
          {series.map((s, i) => (
            <Line
              key={s.ticker}
              type="monotone"
              dataKey={s.ticker}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="muted">
        {comparing ? 'Normalized: each series starts at 100 on the first day.' : 'Daily closing price.'}
      </p>
    </div>
  )
}

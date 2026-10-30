export interface PricePoint {
  date: string
  price: number
}

export const MAX_SELECTED = 3

/** Case-insensitive substring match; an empty query returns everything. */
export function filterTickers(all: string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  return q === '' ? all : all.filter((t) => t.toLowerCase().includes(q))
}

/** Adds or removes a ticker; additions beyond `max` are ignored. */
export function toggleSelection(selected: string[], ticker: string, max = MAX_SELECTED): string[] {
  if (selected.includes(ticker)) return selected.filter((t) => t !== ticker)
  return selected.length >= max ? selected : [...selected, ticker]
}

/** Adds a `normalized` field where the first price equals 100. */
export function normalizeTo100(points: PricePoint[]): (PricePoint & { normalized: number })[] {
  if (points.length === 0) return []
  const base = points[0].price
  return points.map((p) => ({ ...p, normalized: (p.price / base) * 100 }))
}

import type { PricePoint } from './lib'

export interface Stats {
  ticker: string
  totalReturnPct: number
  dailyVolatility: number
  maxDrawdownPct: number
}

export interface PriceSeries {
  ticker: string
  prices: PricePoint[]
}

/** Thrown when the API answers with a non-2xx status. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const UNREACHABLE = 'Cannot reach the API. Is the backend running on http://localhost:5080?'

async function getJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new Error(UNREACHABLE)
  }
  // The Vite dev proxy answers 502-504 when the backend is down, so fetch itself still resolves.
  if (res.status >= 502 && res.status <= 504) throw new Error(UNREACHABLE)
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`)
  return (await res.json()) as T
}

const enc = encodeURIComponent

export const api = {
  getInstruments: () => getJson<string[]>('/api/instruments'),
  getPrices: (ticker: string) => getJson<PriceSeries>(`/api/prices/${enc(ticker)}`),
  getStats: (ticker: string) => getJson<Stats>(`/api/prices/${enc(ticker)}/stats`),
}

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const TICKERS = ['TICK0001', 'TICK0002', 'TICK0003', 'TICK0004']

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }))
}

/** Fake API: known tickers get 3 prices; anything in `missing` returns 404. */
function mockApi(missing: string[] = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url === '/api/instruments') return json(TICKERS)
      const m = url.match(/^\/api\/prices\/([^/]+)(\/stats)?$/)
      if (!m || missing.includes(m[1])) return json({ message: 'nope' }, 404)
      if (m[2]) {
        return json({ ticker: m[1], totalReturnPct: 12.5, dailyVolatility: 1.25, maxDrawdownPct: -3.5 })
      }
      return json({
        ticker: m[1],
        prices: [
          { date: '2026-06-23', price: 100 },
          { date: '2026-06-24', price: 105 },
          { date: '2026-06-25', price: 112.5 },
        ],
      })
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('shows a loading message, then the ticker list', async () => {
    mockApi()
    render(<App />)
    expect(screen.getByText('Loading instruments…')).toBeTruthy()
    expect(await screen.findByLabelText('TICK0001')).toBeTruthy()
  })

  it('shows an explicit empty state when the search has no matches', async () => {
    mockApi()
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Search tickers'), 'zzz')
    expect(screen.getByText('No matching tickers')).toBeTruthy()
  })

  it('shows the chart and stats for one selected ticker', async () => {
    mockApi()
    render(<App />)
    await userEvent.click(await screen.findByLabelText('TICK0001'))
    expect(await screen.findByText('+12.50%')).toBeTruthy()
    expect(screen.getByText('1.25%')).toBeTruthy()
    expect(screen.getByText('-3.50%')).toBeTruthy()
  })

  it('shows a comparison with one stats row per selected ticker', async () => {
    mockApi()
    render(<App />)
    await userEvent.click(await screen.findByLabelText('TICK0001'))
    await userEvent.click(screen.getByLabelText('TICK0002'))
    expect(await screen.findByRole('heading', { name: 'Comparison' })).toBeTruthy()
    expect(screen.getAllByText('+12.50%')).toHaveLength(2)
  })

  it('blocks a 4th selection with a hint, and recovers after deselecting', async () => {
    mockApi()
    render(<App />)
    for (const t of TICKERS.slice(0, 3)) await userEvent.click(await screen.findByLabelText(t))
    await userEvent.click(screen.getByLabelText('TICK0004'))

    expect(screen.getByText(/up to 3 tickers/)).toBeTruthy()
    expect((screen.getByLabelText('TICK0004') as HTMLInputElement).checked).toBe(false)

    await userEvent.click(screen.getByLabelText('TICK0003')) // deselect
    await userEvent.click(screen.getByLabelText('TICK0004'))
    expect((screen.getByLabelText('TICK0004') as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByText(/up to 3 tickers/)).toBeNull()
  })

  it('shows "Ticker not found" when the API returns 404', async () => {
    mockApi(['TICK0002'])
    render(<App />)
    await userEvent.click(await screen.findByLabelText('TICK0002'))
    expect(await screen.findByText('Ticker not found.')).toBeTruthy()
  })

  it('treats a proxy 502 (backend down in dev) as "Cannot reach the API"', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 502 }))))
    render(<App />)
    expect(await screen.findByText(/Cannot reach the API/)).toBeTruthy()
    expect(screen.queryByText(/Request failed/)).toBeNull()
  })

  it('shows an error banner with Retry when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    render(<App />)
    expect(await screen.findByText(/Cannot reach the API/)).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy())
  })
})

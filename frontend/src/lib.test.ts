import { describe, expect, it } from 'vitest'
import { filterTickers, normalizeTo100, toggleSelection } from './lib'

describe('filterTickers', () => {
  it('matches case-insensitive substrings', () => {
    expect(filterTickers(['TICK0001', 'TICK0010'], 'tick001')).toEqual(['TICK0010'])
  })

  it('returns everything for an empty or whitespace query', () => {
    expect(filterTickers(['A', 'B'], '')).toEqual(['A', 'B'])
    expect(filterTickers(['A', 'B'], '  ')).toEqual(['A', 'B'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterTickers(['A', 'B'], 'zzz')).toEqual([])
  })
})

describe('toggleSelection', () => {
  it('ignores a 4th ticker', () => {
    expect(toggleSelection(['A', 'B', 'C'], 'D')).toEqual(['A', 'B', 'C'])
  })

  it('adds a ticker when under the limit', () => {
    expect(toggleSelection(['A'], 'B')).toEqual(['A', 'B'])
  })

  it('removes a selected ticker, down to a single selection', () => {
    expect(toggleSelection(['A', 'B'], 'B')).toEqual(['A'])
  })

  it('allows selecting again after deselecting from a full set', () => {
    const afterRemove = toggleSelection(['A', 'B', 'C'], 'C')
    expect(toggleSelection(afterRemove, 'D')).toEqual(['A', 'B', 'D'])
  })
})

describe('normalizeTo100', () => {
  it('rebases the first price to 100', () => {
    const out = normalizeTo100([
      { date: 'd1', price: 50 },
      { date: 'd2', price: 100 },
    ])
    expect(out.map((p) => p.normalized)).toEqual([100, 200])
    expect(out.map((p) => p.price)).toEqual([50, 100])
  })

  it('returns an empty array for empty input', () => {
    expect(normalizeTo100([])).toEqual([])
  })
})

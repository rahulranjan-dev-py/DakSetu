import officialRates from './official-rates.json' with { type: 'json' }
import type { Product } from '../types.ts'

/**
 * Official monthly tabular premiums (₹ per ₹1,000 SA) parsed from India Post's
 * Dak Sewa app quotations (v1.0.7, monthly mode, standard age proof) at ages
 * 19, 22, 25, 29, 35, 40, 45, 50 and 55.
 *
 *   EA  → keyed by maturity age, then age next birthday
 *   WLA → keyed by premium-ceasing age (Suvidha/Gram Suvidha share these rates)
 *   AEA → keyed by policy term (10 = Gram Priya, 15/20 = Sumangal)
 *   CHILD → keyed by policy term, then the child's age (Bal Jeevan Bima; the
 *           rate depends on the term only and is the same for PLI and RPLI)
 *   JOINT → keyed by policy term, then the effective age (Yugal Suraksha, PLI only)
 *
 * The rate generator uses these values verbatim at the quoted ages and lets the
 * actuarial model interpolate the ages in between (see scripts/generate-rates.ts).
 */
export type AnchorKind = 'EA' | 'WLA' | 'AEA' | 'CHILD' | 'JOINT'
type Series = Record<string, number>

export const OFFICIAL_RATES = officialRates as unknown as {
  meta: Record<string, unknown>
} & Record<Product, Record<AnchorKind, Record<string, Series>>>

/** Piecewise-linear interpolation (clamped at the ends) over a numeric-keyed map. */
export function interpolateByTerm(map: Record<number | string, number>, x: number): number {
  const keys = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
  if (keys.length === 0) return 1
  if (x <= keys[0]) return map[keys[0]]
  if (x >= keys[keys.length - 1]) return map[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i],
      b = keys[i + 1]
    if (x >= a && x <= b) return map[a] + ((map[b] - map[a]) * (x - a)) / (b - a)
  }
  return map[keys[keys.length - 1]]
}

/** Official series (age → rate) for a product / kind / key, or undefined. */
export function officialSeries(product: Product, kind: AnchorKind, key: number): Series | undefined {
  return OFFICIAL_RATES[product]?.[kind]?.[String(key)]
}

/**
 * Rate for any age: the official value when quoted, otherwise the model value
 * scaled by the official/model ratio interpolated across the quoted ages.
 */
export function anchoredRate(
  product: Product,
  kind: AnchorKind,
  key: number,
  age: number,
  model: (age: number) => number,
): number | undefined {
  const series = officialSeries(product, kind, key)
  if (!series) return undefined
  if (series[String(age)] !== undefined) return series[String(age)]
  const ratios: Record<number, number> = {}
  for (const a of Object.keys(series)) {
    const m = model(+a)
    if (m > 0) ratios[+a] = series[a] / m
  }
  return roundRate(product, model(age) * interpolateByTerm(ratios, age))
}

/**
 * Endowment rates at a reference age laid out by policy term (used to scale
 * plans with no official data: children and joint-life policies).
 */
export function endowmentByTerm(product: Product, refAge = 29): Record<number, number> {
  const out: Record<number, number> = {}
  for (const [maturity, series] of Object.entries(OFFICIAL_RATES[product].EA)) {
    const r = series[String(refAge)]
    if (r !== undefined) out[+maturity - refAge] = r
  }
  return out
}

/** PLI tabular rates are whole rupees per ₹10,000 SA; RPLI rates carry paise per ₹10,000. */
export function roundRate(product: Product, rate: number): number {
  return product === 'PLI' ? Math.round(rate * 10) / 10 : Math.round(rate * 1000) / 1000
}

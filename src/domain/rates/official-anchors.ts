import type { Product } from '../types.ts'

/**
 * Official monthly tabular premium (₹ per ₹1,000 SA) taken from Dak Sewa app
 * quotations (India Post, app v1.0.7, bonus effective 01-04-2024), all for a
 * policyholder aged 29 (age next birthday) with SA ₹5,00,000 / ₹1,00,000.
 *
 * The rate generator anchors every plan's table to these values: at age 29 the
 * table reproduces them exactly, and the actuarial model supplies only the
 * variation across ages. Keys are policy term (EA/AEA) or premium-paying term
 * (WLA/CWLA) in years.
 */
export const ANCHOR_AGE = 29

export type AnchorKind = 'EA' | 'WLA' | 'AEA'

export const OFFICIAL_ANCHORS: Record<Product, Record<AnchorKind, Record<number, number>>> = {
  PLI: {
    // Santosh – maturity 35/40/45/50/55/58/60 (PLI rates are whole rupees per ₹10,000)
    EA: { 6: 14.4, 11: 7.6, 16: 5.2, 21: 3.8, 26: 3.0, 29: 2.6, 31: 2.6 },
    // Suraksha / Suvidha – premium ceasing 55/58/60
    WLA: { 26: 2.2, 29: 2.0, 31: 2.0 },
    // Sumangal – 15 / 20 year
    AEA: { 15: 6.6, 20: 5.0 },
  },
  RPLI: {
    // Gram Santosh (RPLI rates are half-rupee steps per ₹10,000). The Dak Sewa
    // "Non standard age proof" tick adds +5 % on top of these tabular values.
    EA: { 6: 14.3, 11: 7.6, 16: 5.1, 21: 3.8, 26: 3.0, 29: 2.65, 31: 2.5 },
    // Gram Suraksha / Gram Suvidha
    WLA: { 26: 2.15, 29: 2.0, 31: 1.95 },
    // Gram Sumangal 15 / 20 year and Gram Priya 10 year
    AEA: { 10: 9.75, 15: 6.55, 20: 5.0 },
  },
}

/** Piecewise-linear interpolation (clamped at the ends) over a term-keyed map. */
export function interpolateByTerm(map: Record<number, number>, term: number): number {
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b)
  if (term <= keys[0]) return map[keys[0]]
  if (term >= keys[keys.length - 1]) return map[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1]
    if (term >= a && term <= b) {
      const w = (term - a) / (b - a)
      return map[a] + (map[b] - map[a]) * w
    }
  }
  return map[keys[keys.length - 1]]
}

/** PLI tabular rates are whole rupees per ₹10,000 SA; RPLI rates are half-rupee steps per ₹10,000. */
export function roundRate(product: Product, rate: number): number {
  return product === 'PLI' ? Math.round(rate * 10) / 10 : Math.round(rate * 20) / 20
}

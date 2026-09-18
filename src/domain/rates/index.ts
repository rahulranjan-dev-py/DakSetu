import tables from './premium-tables.json'
import { RATE_OVERRIDES, overrideKey } from './rate-overrides.ts'
import type { PlanKind, Product } from '../types.ts'
import { PLI_ASSUMPTIONS, RPLI_ASSUMPTIONS } from '../actuarial/assumptions.ts'
import {
  anticipatedSpec,
  childSpec,
  endowmentSpec,
  grossMonthlyRatePer1000,
  jointLifeSpec,
  wholeLifeSpec,
} from '../actuarial/model.ts'
import type { MoneyBackStep } from '../types.ts'
import { anchoredRate, endowmentByTerm, interpolateByTerm, officialSeries, roundRate } from './official-anchors.ts'

type Table = Record<string, Record<string, number>>
type TabulatedKind = Exclude<PlanKind, 'JOINT' | 'CWLA'>

const TABLES = tables as unknown as {
  meta: { generatedAt: string }
  PLI: Record<TabulatedKind, Table>
  RPLI: Record<TabulatedKind, Table>
}

export const RATE_TABLE_META = TABLES.meta

export function assumptionsFor(product: Product) {
  return product === 'PLI' ? PLI_ASSUMPTIONS : RPLI_ASSUMPTIONS
}

function lookup(product: Product, kind: TabulatedKind, termKey: number, age: number): number | undefined {
  const override = RATE_OVERRIDES[overrideKey(product, kind, termKey, age)]
  if (override !== undefined) return override
  return TABLES[product][kind]?.[String(termKey)]?.[String(age)]
}

/** Monthly premium per ₹1,000 SA for an endowment (Santosh / Gram Santosh). */
export function endowmentRate(product: Product, age: number, maturityAge: number, bonusRate: number): number {
  return (
    lookup(product, 'EA', maturityAge, age) ??
    grossMonthlyRatePer1000(endowmentSpec(age, maturityAge - age, bonusRate), assumptionsFor(product))
  )
}

/** Monthly premium per ₹1,000 SA for whole life (Suraksha / Gram Suraksha). */
export function wholeLifeRate(product: Product, age: number, ceasingAge: number, bonusRate: number): number {
  return (
    lookup(product, 'WLA', ceasingAge, age) ??
    grossMonthlyRatePer1000(wholeLifeSpec(age, ceasingAge, bonusRate), assumptionsFor(product))
  )
}

/** Monthly premium per ₹1,000 SA for money-back plans (Sumangal / Gram Sumangal / Gram Priya). */
export function anticipatedRate(
  product: Product,
  age: number,
  term: number,
  schedule: MoneyBackStep[],
  bonusRate: number,
): number {
  return (
    lookup(product, 'AEA', term, age) ??
    grossMonthlyRatePer1000(anticipatedSpec(age, term, schedule, bonusRate), assumptionsFor(product))
  )
}

/** Monthly premium per ₹1,000 SA for children policies (Bal Jeevan Bima). */
export function childRate(product: Product, childAge: number, term: number, bonusRate: number): number {
  const a = assumptionsFor(product)
  return lookup(product, 'CHILD', term, childAge) ?? grossMonthlyRatePer1000(childSpec(childAge, term, bonusRate, a), a)
}

/** Dak Sewa rates a joint-life policy on the rounded average of the two ages. */
export function jointEffectiveAge(age1: number, age2: number): number {
  return Math.round((age1 + age2) / 2)
}

/**
 * Monthly premium per ₹1,000 SA for joint life (Yugal Suraksha), keyed by the
 * effective age. Official Dak Sewa cells are used verbatim; other effective
 * ages take the actuarial model scaled by the official/model ratio.
 */
export function jointLifeRate(product: Product, age1: number, age2: number, term: number, bonusRate: number): number {
  const a = assumptionsFor(product)
  const eff = jointEffectiveAge(age1, age2)
  const modelAt = (x: number) => grossMonthlyRatePer1000(jointLifeSpec(x, x, term, bonusRate, a), a)
  if (officialSeries(product, 'JOINT', term)) {
    const anchored = anchoredRate(product, 'JOINT', term, eff, modelAt)
    if (anchored !== undefined) return anchored
  }
  const official = endowmentByTerm(product, 29)
  const ratios: Record<number, number> = {}
  for (const t of Object.keys(official).map(Number)) {
    ratios[t] = official[t] / grossMonthlyRatePer1000(endowmentSpec(29, t, bonusRate), a)
  }
  const model = grossMonthlyRatePer1000(jointLifeSpec(age1, age2, term, bonusRate, a), a)
  return roundRate(product, model * interpolateByTerm(ratios, term))
}

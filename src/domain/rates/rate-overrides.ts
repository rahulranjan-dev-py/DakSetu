import type { PlanKind, Product } from '../types.ts'

/**
 * Official premium figures that should override the generated baseline.
 *
 * Key format:  `${product}:${kind}:${termKey}:${ageNextBirthday}`
 *   - EA    → termKey = maturity age            e.g. "PLI:EA:60:30"
 *   - WLA   → termKey = premium ceasing age     e.g. "PLI:WLA:60:30"
 *   - AEA   → termKey = policy term (10/15/20)  e.g. "RPLI:AEA:10:30"
 *   - CHILD → termKey = policy term             e.g. "PLI:CHILD:15:8"
 *
 * Value: monthly premium (₹) per ₹1,000 sum assured.
 */
export const RATE_OVERRIDES: Record<string, number> = {
  // Official Dak Sewa quotations live in official-rates.json; add further
  // verified cells here, e.g. 'PLI:EA:60:31': 2.8,
}

export function overrideKey(
  product: Product,
  kind: Exclude<PlanKind, 'JOINT' | 'CWLA'>,
  termKey: number,
  age: number,
): string {
  return `${product}:${kind}:${termKey}:${age}`
}

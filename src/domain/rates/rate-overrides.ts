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
  // Santosh (EA) figures from India Post-linked premium tables:
  // age 26, maturity 50, SA ₹5,10,000 → ₹1,632/month before rebate (₹3.20 per ₹1,000)
  'PLI:EA:50:26': 3.2,
  // age 27, maturity 35, SA ₹7,00,000 → ₹106 per ₹10,000 per month (₹10.60 per ₹1,000)
  'PLI:EA:35:27': 10.6,
}

export function overrideKey(
  product: Product,
  kind: Exclude<PlanKind, 'JOINT' | 'CWLA'>,
  termKey: number,
  age: number,
): string {
  return `${product}:${kind}:${termKey}:${age}`
}

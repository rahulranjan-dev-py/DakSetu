import { PLAN_BY_ID } from '@/domain/catalog.ts'
import type { PaymentMode, PlanId, Product } from '@/domain/types.ts'
import type { AgeMode, CalculatorState } from './state.ts'

const MODES: PaymentMode[] = ['monthly', 'quarterly', 'halfYearly', 'yearly']

const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback
}
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)
const str = (v: unknown, fallback: string, maxLen: number): string => (typeof v === 'string' ? v.slice(0, maxLen) : fallback)
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback)

/**
 * Validates whatever came back from localStorage (older schema, hand-edited,
 * corrupted) so that `calculate()` can never be handed an unknown plan or a
 * non-numeric age. Every field falls back to the default individually.
 */
export function sanitizeState(raw: unknown, defaults: CalculatorState): CalculatorState {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const planId = (typeof r.planId === 'string' && r.planId in PLAN_BY_ID ? r.planId : defaults.planId) as PlanId
  const product: Product = PLAN_BY_ID[planId].product
  return {
    product,
    planId,
    ageMode: oneOf<AgeMode>(r.ageMode, ['age', 'dob'], defaults.ageMode),
    dob: /^\d{4}-\d{2}-\d{2}$/.test(String(r.dob ?? '')) ? (r.dob as string) : '',
    completedAge: num(r.completedAge, defaults.completedAge, 0, 120),
    spouseCompletedAge: num(r.spouseCompletedAge, defaults.spouseCompletedAge, 0, 120),
    parentCompletedAge: num(r.parentCompletedAge, defaults.parentCompletedAge, 0, 120),
    sumAssured: num(r.sumAssured, defaults.sumAssured, 0, 99_999_999),
    maturityAge: num(r.maturityAge, defaults.maturityAge, 0, 120),
    ceasingAge: num(r.ceasingAge, defaults.ceasingAge, 0, 120),
    term: num(r.term, defaults.term, 0, 100),
    conversionYear: num(r.conversionYear, defaults.conversionYear, 0, 100),
    conversionMaturityAge: num(r.conversionMaturityAge, defaults.conversionMaturityAge, 0, 120),
    paymentMode: oneOf<PaymentMode>(r.paymentMode, MODES, defaults.paymentMode),
    applySARebate: bool(r.applySARebate, defaults.applySARebate),
    nonStandardAgeProof: bool(r.nonStandardAgeProof, defaults.nonStandardAgeProof),
    customerName: str(r.customerName, '', 60),
    customerMobile: str(r.customerMobile, '', 200).replace(/[^\d+]/g, '').slice(0, 13),
  }
}

import { describe, expect, it } from 'vitest'
import { sanitizeState } from './sanitize.ts'
import { calculate } from '@/domain/engine.ts'
import { calculateFine } from '@/domain/fine.ts'
import type { CalculatorState } from './state.ts'

const DEFAULTS: CalculatorState = {
  product: 'PLI', planId: 'pli-santosh', ageMode: 'age', dob: '', completedAge: 30, spouseCompletedAge: 27, parentCompletedAge: 34,
  sumAssured: 500_000, maturityAge: 60, ceasingAge: 60, term: 15, conversionYear: 0, conversionMaturityAge: 60,
  paymentMode: 'monthly', applySARebate: true, nonStandardAgeProof: false, customerName: '', customerMobile: '',
}

describe('sanitizeState', () => {
  it('falls back per field for corrupted or legacy storage and never breaks calculate()', () => {
    const cases: unknown[] = [
      null, 'garbage', [1, 2], { planId: 'pli-does-not-exist' }, { planId: 'rpli-gram-priya', product: 'PLI' },
      { completedAge: 'thirty', sumAssured: 'lots', maturityAge: null, term: '20' },
      { paymentMode: 'weekly' }, { completedAge: 1e9, sumAssured: 1e15, maturityAge: -5, term: 1e6 },
      JSON.parse('{"__proto__":{"polluted":1},"planId":"pli-santosh"}'), { customerName: 'x'.repeat(500), customerMobile: 'abc+9198765 43210xyz' },
    ]
    for (const raw of cases) {
      const s = sanitizeState(raw, DEFAULTS)
      expect(() => calculate({ planId: s.planId, age: s.completedAge, spouseAge: s.spouseCompletedAge, parentAge: s.parentCompletedAge, sumAssured: s.sumAssured, maturityAge: s.maturityAge, ceasingAge: s.ceasingAge, term: s.term, conversionYear: s.conversionYear, conversionMaturityAge: s.conversionMaturityAge, paymentMode: s.paymentMode, applySARebate: s.applySARebate, nonStandardAgeProof: s.nonStandardAgeProof })).not.toThrow()
    }
    expect(sanitizeState({ planId: 'rpli-gram-priya', product: 'PLI' }, DEFAULTS).product).toBe('RPLI')
    expect(sanitizeState({ completedAge: '20', term: '20' }, DEFAULTS)).toMatchObject({ completedAge: 20, term: 20 })
    expect(sanitizeState({ customerName: 'x'.repeat(500), customerMobile: 'abc+9198765 43210xyz' }, DEFAULTS)).toMatchObject({ customerName: 'x'.repeat(60), customerMobile: '+919876543210' })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('calculateFine guards', () => {
  it('treats non-finite inputs as zero', () => {
    const f = calculateFine({ premium: NaN, monthsOverdue: Infinity, instalmentsDue: NaN, policyOverThreeYears: false })
    expect(Number.isFinite(f.totalPayable)).toBe(true)
    expect(f.totalPayable).toBe(0)
  })
})

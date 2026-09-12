import { describe, expect, it } from 'vitest'
import { buildPremium, calculate, defaultInputFor, irr, saRebateFor } from './engine.ts'
import { PLAN_BY_ID, PLANS } from './catalog.ts'
import { CONFIG } from './config.ts'
import { calculateFine } from './fine.ts'
import { checkEligibility } from './eligibility.ts'
import { ageFromDOB } from './age.ts'

describe('premium building blocks', () => {
  it('applies the high sum assured rebate per ₹20,000 above threshold', () => {
    expect(saRebateFor(100_000, true)).toBe(0)
    expect(saRebateFor(500_000, true)).toBe(20)
    expect(saRebateFor(5_000_000, true)).toBe(245)
    expect(saRebateFor(5_000_000, false)).toBe(0)
  })

  it('computes GST at 4.5% for year 1 and 2.25% for renewals', () => {
    const p = buildPremium(2.0, 500_000, 'monthly', false)
    expect(p.netMonthly).toBe(1000)
    expect(p.gstFirstYear).toBeCloseTo(45)
    expect(p.gstRenewal).toBeCloseTo(22.5)
    expect(p.totalFirstYear).toBeCloseTo(1045)
    expect(p.totalRenewal).toBeCloseTo(1022.5)
  })

  it('applies mode multipliers and advance premium rebates', () => {
    const q = buildPremium(2.0, 500_000, 'quarterly', false)
    const h = buildPremium(2.0, 500_000, 'halfYearly', false)
    const y = buildPremium(2.0, 500_000, 'yearly', false)
    expect(q.modal).toBe(3000)
    expect(h.modal).toBe(Math.round(6000 * (1 - CONFIG.modeRebate.halfYearly)))
    expect(y.modal).toBe(Math.round(12000 * (1 - CONFIG.modeRebate.yearly)))
  })

  it('solves IRR for a simple cash-flow', () => {
    // pay 100 now, receive 121 after 2 years → 10%
    expect(irr([-100, 0, 121])!).toBeCloseTo(0.1, 6)
  })
})

describe('calculate()', () => {
  it('produces a consistent Santosh (EA) projection', () => {
    const r = calculate({
      planId: 'pli-santosh',
      age: 30,
      sumAssured: 500_000,
      maturityAge: 60,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.issues).toEqual([])
    expect(r.term).toBe(30)
    expect(r.bonus.total).toBe((500_000 / 1000) * 52 * 30)
    expect(r.maturity.finalPayout).toBe(500_000 + r.bonus.total)
    expect(r.years).toHaveLength(30)
    expect(r.years[0].gst).toBeCloseTo(r.years[0].base * 0.045, 2)
    expect(r.years[1].gst).toBeCloseTo(r.years[1].base * 0.0225, 2)
    expect(r.totals.outgo).toBeCloseTo(r.years.at(-1)!.cumulative, 1)
    expect(r.returns.irr).not.toBeNull()
    expect(r.returns.irr!).toBeGreaterThan(0.04)
    expect(r.returns.irr!).toBeLessThan(0.09)
    expect(r.loan.schedule[0].year).toBe(3)
  })

  it('lists every Sumangal money-back instalment and nets the final cheque', () => {
    const r = calculate({
      planId: 'pli-sumangal',
      age: 30,
      sumAssured: 1_000_000,
      term: 20,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.issues).toEqual([])
    const survival = r.milestones.filter((m) => m.kind === 'survival')
    expect(survival.map((m) => m.year)).toEqual([8, 12, 16])
    expect(survival.every((m) => m.amount === 200_000)).toBe(true)
    expect(r.maturity.survivalPaid).toBe(600_000)
    expect(r.maturity.finalPayout).toBe(400_000 + 1000 * 48 * 20)
    expect(r.maturity.totalBenefit).toBe(1_000_000 + r.bonus.total)
  })

  it('handles Gram Priya 20/20/60 schedule', () => {
    const r = calculate({
      planId: 'rpli-gram-priya',
      age: 30,
      sumAssured: 100_000,
      term: 10,
      paymentMode: 'yearly',
      applySARebate: true,
    })
    expect(r.issues).toEqual([])
    expect(r.milestones.map((m) => [m.year, m.pct])).toEqual([
      [4, 20],
      [7, 20],
      [10, 60],
    ])
    expect(r.maturity.finalPayout).toBe(60_000 + 100 * 45 * 10)
  })

  it('stops premiums at the ceasing age but accrues bonus to 80 for Suraksha', () => {
    const r = calculate({
      planId: 'pli-suraksha',
      age: 30,
      sumAssured: 1_000_000,
      ceasingAge: 60,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.premiumTerm).toBe(30)
    expect(r.term).toBe(50)
    expect(r.years[30].base).toBe(0)
    expect(r.bonus.total).toBe(1000 * 76 * 50)
    expect(r.milestones.some((m) => m.kind === 'premiumEnd' && m.year === 30)).toBe(true)
  })

  it('splits Suvidha bonus & premium at conversion', () => {
    const r = calculate({
      planId: 'pli-suvidha',
      age: 30,
      sumAssured: 500_000,
      ceasingAge: 60,
      conversionYear: 5,
      conversionMaturityAge: 60,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.issues).toEqual([])
    expect(r.term).toBe(30)
    expect(r.bonus.total).toBe(500 * 76 * 5 + 500 * 52 * 25)
    expect(r.premiumAfterConversion).toBeDefined()
    expect(r.years[5].base).toBe(r.premiumAfterConversion!.modal * 12)
    expect(r.years[4].base).toBe(r.premium.modal * 12)
  })

  it('validates entry limits', () => {
    const r = calculate({
      planId: 'pli-sumangal',
      age: 44,
      sumAssured: 6_000_000,
      term: 20,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.issues.map((i) => i.code)).toEqual(expect.arrayContaining(['SA_MAX', 'AGE_FOR_TERM']))
  })

  it('has default inputs that validate for every plan', () => {
    for (const plan of PLANS) {
      const r = calculate(defaultInputFor(plan))
      expect(r.issues, plan.id).toEqual([])
      expect(r.premium.netMonthly, plan.id).toBeGreaterThan(0)
      expect(Number.isFinite(r.returns.roi), plan.id).toBe(true)
    }
  })

  it('premium rises with age for endowment plans', () => {
    const at = (age: number) =>
      calculate({ planId: 'rpli-gram-santosh', age, sumAssured: 100_000, maturityAge: 60, paymentMode: 'monthly', applySARebate: false })
        .premium.netMonthly
    expect(at(25)).toBeLessThan(at(35))
    expect(at(35)).toBeLessThan(at(45))
  })

  it('exposes plan metadata used by the UI', () => {
    expect(PLAN_BY_ID['pli-yugal-suraksha'].joint).toBe(true)
    expect(PLAN_BY_ID['rpli-bal-jeevan'].maxSA).toBe(100_000)
  })
})

describe('utilities', () => {
  it('computes default fee as ₹1 per ₹100 per month', () => {
    const f = calculateFine({ premium: 1250, monthsOverdue: 3, instalmentsDue: 3, policyOverThreeYears: false })
    // instalments overdue 3, 2 and 1 months → 6 fee-months × ₹13
    expect(f.feePerInstalmentPerMonth).toBe(13)
    expect(f.totalFee).toBe(78)
    expect(f.arrears).toBe(3750)
    expect(f.lapsed).toBe(false)
    expect(f.monthsToLapse).toBe(3)
  })

  it('checks eligibility', () => {
    expect(checkEligibility({ age: 30, occupation: 'centralGovt', residence: 'urban' })).toMatchObject({ pli: true, rpli: false })
    expect(checkEligibility({ age: 30, occupation: 'farmer', residence: 'rural' })).toMatchObject({ pli: false, rpli: true })
    expect(checkEligibility({ age: 60, occupation: 'psu', residence: 'rural' })).toMatchObject({ pli: false, rpli: false, pliReason: 'age' })
  })

  it('derives age next birthday from DOB', () => {
    const a = ageFromDOB(new Date('1990-06-15'), new Date('2026-09-12'))
    expect(a).toEqual({ completed: 36, nextBirthday: 37 })
    const b = ageFromDOB(new Date('1990-12-15'), new Date('2026-09-12'))
    expect(b).toEqual({ completed: 35, nextBirthday: 36 })
  })
})

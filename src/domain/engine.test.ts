import { describe, expect, it } from 'vitest'
import { buildPremium, calculate, defaultInputFor, irr, saRebateFor, terminalBonusFor } from './engine.ts'
import { PLAN_BY_ID, PLANS } from './catalog.ts'
import { CONFIG } from './config.ts'
import { calculateFine } from './fine.ts'
import { checkEligibility } from './eligibility.ts'
import { ageFromDOB } from './age.ts'

describe('premium building blocks', () => {
  it('applies the high sum assured rebate of ₹1 per ₹20,000 SA (SA ₹5.1L → ₹25, ₹7L → ₹35)', () => {
    expect(saRebateFor(10_000, true)).toBe(0)
    expect(saRebateFor(20_000, true)).toBe(1)
    expect(saRebateFor(510_000, true)).toBe(25)
    expect(saRebateFor(700_000, true)).toBe(35)
    expect(saRebateFor(5_000_000, true)).toBe(250)
    expect(saRebateFor(5_000_000, false)).toBe(0)
  })

  it('reproduces the India Post Santosh worked examples', () => {
    // age 26 (ANB), maturity 50, SA ₹5,10,000 → ₹1,632 tabular, ₹1,607 net monthly; yearly ₹18,702
    const r = calculate({ planId: 'pli-santosh', age: 26, sumAssured: 510_000, maturityAge: 50, paymentMode: 'monthly', applySARebate: true })
    expect(r.premium.tabularMonthly).toBeCloseTo(1632, 0)
    expect(r.premium.netMonthly).toBe(1607)
    expect(r.premium.saRebate).toBe(25)
    const y = calculate({ planId: 'pli-santosh', age: 26, sumAssured: 510_000, maturityAge: 50, paymentMode: 'yearly', applySARebate: true })
    expect(Math.abs(y.premium.modal - 18_702)).toBeLessThan(200)
    // age 27, maturity 35, SA ₹7,00,000 → ₹7,385/month
    const s = calculate({ planId: 'pli-santosh', age: 27, sumAssured: 700_000, maturityAge: 35, paymentMode: 'monthly', applySARebate: true })
    expect(s.premium.netMonthly).toBe(7385)
    // maturity: SA + 52 × 700 × 8 + no terminal bonus (term < 20)
    expect(s.maturity.finalPayout).toBe(700_000 + 700 * 52 * 8)
  })

  it('charges NIL GST on premiums (exempt since 22 Sep 2025)', () => {
    expect(CONFIG.gst.firstYear).toBe(0)
    expect(CONFIG.gst.renewal).toBe(0)
    expect(CONFIG.gst.legacy).toEqual({ firstYear: 0.045, renewal: 0.0225 })
    const p = buildPremium(2.0, 500_000, 'monthly', false)
    expect(p.netMonthly).toBe(1000)
    expect(p.gstFirstYear).toBe(0)
    expect(p.totalFirstYear).toBe(1000)
    expect(p.totalRenewal).toBe(1000)
  })

  it('applies mode multipliers and advance premium rebates (PLI 1% / 2%; RPLI also 0.5% quarterly)', () => {
    const q = buildPremium(2.0, 500_000, 'quarterly', false, 'PLI')
    const qr = buildPremium(2.0, 500_000, 'quarterly', false, 'RPLI')
    const h = buildPremium(2.0, 500_000, 'halfYearly', false, 'PLI')
    const y = buildPremium(2.0, 500_000, 'yearly', false, 'PLI')
    expect(q.modal).toBe(3000)
    expect(qr.modal).toBe(Math.round(3000 * 0.995))
    expect(h.modal).toBe(Math.round(6000 * 0.99))
    expect(y.modal).toBe(Math.round(12000 * 0.98))
  })

  it('pays a terminal bonus of ₹20 per ₹10,000 (max ₹1,000) on 20+ year WLA/EA policies', () => {
    expect(terminalBonusFor('EA', 100_000, 30)).toBe(200)
    expect(terminalBonusFor('EA', 500_000, 30)).toBe(1000)
    expect(terminalBonusFor('WLA', 1_000_000, 50)).toBe(1000)
    expect(terminalBonusFor('EA', 500_000, 19)).toBe(0)
    expect(terminalBonusFor('AEA', 500_000, 20)).toBe(0)
    expect(terminalBonusFor('JOINT', 500_000, 20)).toBe(0)
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
    expect(r.bonus.terminal).toBe(1000)
    expect(r.maturity.finalPayout).toBe(500_000 + r.bonus.total + 1000)
    expect(r.years).toHaveLength(30)
    expect(r.years[0].gst).toBe(0)
    expect(r.totals.gst).toBe(0)
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
    expect(r.bonus.terminal).toBe(0)
    // money-back plans do not permit policy loans
    expect(r.loan.eligibleAfterYears).toBeNull()
    expect(r.loan.schedule.every((row) => row.loanValue === 0)).toBe(true)
  })

  it('reproduces the research illustration: ₹10L Suraksha at 30 → ₹32,81,000 accrued at 60, full payout at 80', () => {
    const r = calculate({
      planId: 'pli-suraksha',
      age: 30,
      sumAssured: 1_000_000,
      ceasingAge: 60,
      paymentMode: 'monthly',
      applySARebate: true,
    })
    expect(r.maturity.accruedValueAtPremiumEnd).toBe(1_000_000 + 1000 * 76 * 30)
    expect(r.milestones.find((m) => m.kind === 'premiumEnd')?.amount).toBe(3_280_000)
    expect(r.bonus.terminal).toBe(1000)
    expect(r.maturity.finalPayout).toBe(1_000_000 + 1000 * 76 * 50 + 1000)
  })

  it('caps Suvidha entry age at 50', () => {
    const r = calculate({ planId: 'pli-suvidha', age: 52, sumAssured: 100_000, ceasingAge: 60, paymentMode: 'monthly', applySARebate: true })
    expect(r.issues.map((i) => i.code)).toContain('AGE_RANGE')
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
    expect(r.milestones.some((m) => m.kind === 'premiumEnd' && m.year === 30 && m.amount === 1_000_000 + 1000 * 76 * 30)).toBe(true)
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
    expect(PLAN_BY_ID['pli-bal-jeevan'].minSA).toBe(10_000)
    expect(PLAN_BY_ID['pli-bal-jeevan'].loanAfterYears).toBeNull()
    expect(PLAN_BY_ID['pli-bal-jeevan'].surrenderAfterYears).toBeNull()
  })

  it('flags medical underwriting per the non-medical thresholds', () => {
    const base = { planId: 'pli-santosh' as const, maturityAge: 60, paymentMode: 'monthly' as const, applySARebate: true }
    expect(calculate({ ...base, age: 30, sumAssured: 500_000 }).medical.required).toBe(false)
    expect(calculate({ ...base, age: 30, sumAssured: 600_000 }).medical.required).toBe(true)
    expect(calculate({ ...base, age: 45, sumAssured: 200_000 }).medical.required).toBe(false)
    expect(calculate({ ...base, age: 45, sumAssured: 300_000 }).medical.required).toBe(true)
    const rural = { planId: 'rpli-gram-santosh' as const, maturityAge: 60, paymentMode: 'monthly' as const, applySARebate: true }
    expect(calculate({ ...rural, age: 30, sumAssured: 100_000 }).medical.required).toBe(false)
    expect(calculate({ ...rural, age: 40, sumAssured: 100_000 }).medical.required).toBe(true)
    expect(calculate({ planId: 'pli-sumangal', age: 30, sumAssured: 100_000, term: 15, paymentMode: 'monthly', applySARebate: true }).medical.required).toBe(true)
  })
})

describe('utilities', () => {
  it('computes default fee as ₹1 per ₹100 per month while the policy is in force', () => {
    const f = calculateFine({ premium: 1250, monthsOverdue: 3, instalmentsDue: 3, policyOverThreeYears: false })
    // instalments overdue 3, 2 and 1 months → 6 fee-months × ₹13
    expect(f.feePerInstalmentPerMonth).toBe(13)
    expect(f.totalFee).toBe(78)
    expect(f.arrears).toBe(3750)
    expect(f.gstOnArrears).toBe(0)
    expect(f.lapsed).toBe(false)
    expect(f.monthsToLapse).toBe(3)
    expect(f.totalPayable).toBe(3750 + 78)
  })

  it('charges compound revival interest instead of default fee once lapsed', () => {
    const f = calculateFine({ premium: 1000, monthsOverdue: 12, instalmentsDue: 12, policyOverThreeYears: false })
    expect(f.lapsed).toBe(true)
    expect(f.revivalInterestRate).toBe(0.12)
    // ≈ 1000 × Σ_{k=1..12} ((1.12)^(k/12) − 1)
    let expected = 0
    for (let k = 1; k <= 12; k++) expected += 1000 * (Math.pow(1.12, k / 12) - 1)
    expect(f.revivalInterest).toBeCloseTo(Math.round(expected * 100) / 100, 2)
    expect(f.totalPayable).toBeCloseTo(12_000 + f.revivalInterest, 2)
  })

  it('checks eligibility including the Aug 2026 savings-account route', () => {
    const d = { hasOperativeAccount: false, standardAgeProof: true }
    expect(checkEligibility({ age: 30, occupation: 'centralGovt', residence: 'urban', ...d })).toMatchObject({ pli: true, rpli: false, rpliReason: 'residence' })
    expect(checkEligibility({ age: 30, occupation: 'farmer', residence: 'rural', ...d })).toMatchObject({ pli: false, rpli: true })
    expect(checkEligibility({ age: 60, occupation: 'psu', residence: 'rural', ...d })).toMatchObject({ pli: false, rpli: false, pliReason: 'age' })
    expect(checkEligibility({ age: 30, occupation: 'selfEmployed', residence: 'urban', hasOperativeAccount: true, standardAgeProof: true })).toMatchObject({ pli: false, rpli: true, rpliReason: 'eligibleAccount' })
    expect(checkEligibility({ age: 50, occupation: 'farmer', residence: 'rural', hasOperativeAccount: false, standardAgeProof: false })).toMatchObject({ rpli: false, rpliReason: 'ageProof' })
    expect(checkEligibility({ age: 30, occupation: 'gds', residence: 'rural', ...d })).toMatchObject({ pli: true, rpli: true })
  })

  it('blocks revival after 5 years of default', () => {
    expect(calculateFine({ premium: 500, monthsOverdue: 59, instalmentsDue: 59, policyOverThreeYears: true }).revivable).toBe(true)
    expect(calculateFine({ premium: 500, monthsOverdue: 60, instalmentsDue: 60, policyOverThreeYears: true }).revivable).toBe(false)
  })

  it('derives age next birthday from DOB', () => {
    const a = ageFromDOB(new Date('1990-06-15'), new Date('2026-09-12'))
    expect(a).toEqual({ completed: 36, nextBirthday: 37 })
    const b = ageFromDOB(new Date('1990-12-15'), new Date('2026-09-12'))
    expect(b).toEqual({ completed: 35, nextBirthday: 36 })
  })
})

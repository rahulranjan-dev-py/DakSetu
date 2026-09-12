import { CONFIG } from './config.ts'
import { PLAN_BY_ID } from './catalog.ts'
import type { PaymentMode, PlanId, PlanSpec, Product } from './types.ts'
import { anticipatedRate, childRate, endowmentRate, jointLifeRate, wholeLifeRate } from './rates/index.ts'
import { WHOLE_LIFE_MATURITY_AGE } from './actuarial/assumptions.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface CalcInput {
  planId: PlanId
  /** Age next birthday of the life assured (for child plans: the child) */
  age: number
  /** Age next birthday of the spouse (joint life) */
  spouseAge?: number
  /** Age of the parent / proposer (child plans) */
  parentAge?: number
  sumAssured: number
  /** Endowment: maturity age */
  maturityAge?: number
  /** Whole life: premium ceasing age */
  ceasingAge?: number
  /** Money-back / joint / child: policy term in years */
  term?: number
  /** Convertible whole life: policy year at end of which conversion happens (0 / undefined = never) */
  conversionYear?: number
  /** Convertible whole life: maturity age after conversion */
  conversionMaturityAge?: number
  paymentMode: PaymentMode
  applySARebate: boolean
}

export type ValidationCode =
  | 'AGE_RANGE'
  | 'SPOUSE_AGE_RANGE'
  | 'PARENT_AGE_MAX'
  | 'SA_MIN'
  | 'SA_MAX'
  | 'SA_STEP'
  | 'TERM_TOO_SHORT'
  | 'TERM_RANGE'
  | 'AGE_FOR_TERM'
  | 'CONVERSION_TERM'

export interface ValidationIssue {
  code: ValidationCode
  params?: Record<string, number | string>
}

// ─────────────────────────────────────────────────────────────────────────────
// Outputs
// ─────────────────────────────────────────────────────────────────────────────

export interface PremiumBreakdown {
  /** Monthly premium per ₹1,000 SA (from rate chart) */
  ratePer1000: number
  /** Tabular monthly premium before rebates */
  tabularMonthly: number
  /** High sum assured rebate (₹ per month) */
  saRebate: number
  /** Monthly premium after SA rebate (the "monthly" figure printed on the policy) */
  netMonthly: number
  /** Selected mode */
  mode: PaymentMode
  modeMultiplier: number
  modeRebatePct: number
  /** Modal premium (per instalment) before GST */
  modal: number
  gstFirstYear: number
  totalFirstYear: number
  gstRenewal: number
  totalRenewal: number
  instalmentsPerYear: number
  /** Monthly-equivalent figures for the hero card */
  monthlyEquivalentFirstYear: number
  monthlyEquivalentRenewal: number
}

export interface YearRow {
  year: number
  age: number
  /** Base premium paid during the year */
  base: number
  gst: number
  total: number
  cumulative: number
  /** Money-back / maturity / conversion event in that year */
  inflow: number
  /** Accrued bonus at year end */
  accruedBonus: number
  /** Life cover (SA + accrued bonus) during the year */
  lifeCover: number
}

export interface Milestone {
  year: number
  age: number
  kind: 'survival' | 'maturity' | 'conversion' | 'premiumEnd'
  pct?: number
  amount: number
  bonusPart?: number
}

export interface LoanRow {
  year: number
  paidUpValue: number
  surrenderValue: number
  loanValue: number
}

export interface CalcResult {
  plan: PlanSpec
  input: CalcInput
  issues: ValidationIssue[]
  /** Policy term in years (until maturity) */
  term: number
  /** Premium paying term in years */
  premiumTerm: number
  maturityAge: number
  premium: PremiumBreakdown
  /** For convertible plans: premium after conversion */
  premiumAfterConversion?: PremiumBreakdown
  years: YearRow[]
  totals: {
    basePremiums: number
    gst: number
    outgo: number
  }
  bonus: {
    rate: number
    rateAfterConversion?: number
    /** Accrued simple reversionary bonus over the full term */
    total: number
    /** Statutory terminal bonus paid with the final settlement (0 if not eligible) */
    terminal: number
  }
  maturity: {
    sumAssured: number
    survivalPaid: number
    finalPayout: number
    totalBenefit: number
    netGain: number
    /** Whole life: SA + bonus accrued when premiums stop (payable on death; full payout at 80) */
    accruedValueAtPremiumEnd?: number
  }
  milestones: Milestone[]
  returns: { roi: number; irr: number | null }
  loan: {
    /** null when the plan does not permit policy loans (money-back plans) */
    eligibleAfterYears: number | null
    schedule: LoanRow[]
  }
  /** Underwriting: whether a medical examination is required for this proposal */
  medical: { required: boolean; nonMedicalLimit: number }
}

/** Non-medical limit for a proposer of the given age (0 = always medical). */
export function nonMedicalLimit(product: Product, age: number): number {
  const m = CONFIG.medical[product]
  return age <= m.nonMedicalUpToAgeLimit ? Math.max(m.nonMedicalAnyAge, m.nonMedicalUpToAge) : m.nonMedicalAnyAge
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const r0 = (n: number) => Math.round(n)
const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * High sum assured rebate: ₹1/month once SA reaches ₹40,000, plus ₹1/month for
 * every further ₹20,000 tier (Post Office Life Insurance Rules).
 */
export function saRebateFor(sumAssured: number, apply: boolean): number {
  const c = CONFIG.saRebate
  if (!apply || !c.enabled || sumAssured < c.minSA) return 0
  return c.baseAmount + Math.floor((sumAssured - c.minSA) / c.step) * c.amountPerStep
}

/**
 * Terminal bonus: ₹20 per ₹10,000 SA capped at ₹1,000 per policy, payable on
 * Whole Life / Endowment contracts that run for 20 years or more.
 */
export function terminalBonusFor(kind: PlanSpec['kind'], sumAssured: number, term: number): number {
  const c = CONFIG.terminalBonus
  if (!c.kinds.includes(kind) || term < c.minTerm) return 0
  return Math.min(Math.floor(sumAssured / 10_000) * c.per10000, c.cap)
}

export function buildPremium(
  ratePer1000: number,
  sumAssured: number,
  mode: PaymentMode,
  applySARebate: boolean,
  product: Product = 'PLI',
): PremiumBreakdown {
  const tabularMonthly = r2((ratePer1000 * sumAssured) / 1000)
  const saRebate = Math.min(saRebateFor(sumAssured, applySARebate), Math.max(0, tabularMonthly - 1))
  const netMonthly = Math.max(1, r0(tabularMonthly - saRebate))
  const modeMultiplier = CONFIG.modeMultiplier[mode]
  const modeRebatePct = CONFIG.modeRebate[product][mode]
  const modal = r0(netMonthly * modeMultiplier * (1 - modeRebatePct))
  const gstFirstYear = r2(modal * CONFIG.gst.firstYear)
  const gstRenewal = r2(modal * CONFIG.gst.renewal)
  const instalmentsPerYear = CONFIG.instalmentsPerYear[mode]
  return {
    ratePer1000,
    tabularMonthly,
    saRebate,
    netMonthly,
    mode,
    modeMultiplier,
    modeRebatePct,
    modal,
    gstFirstYear,
    totalFirstYear: r2(modal + gstFirstYear),
    gstRenewal,
    totalRenewal: r2(modal + gstRenewal),
    instalmentsPerYear,
    monthlyEquivalentFirstYear: r2(((modal + gstFirstYear) * instalmentsPerYear) / 12),
    monthlyEquivalentRenewal: r2(((modal + gstRenewal) * instalmentsPerYear) / 12),
  }
}

/** Annualised internal rate of return of yearly cash flows (t = 0..n) via bisection. */
export function irr(cashflows: number[]): number | null {
  const npv = (r: number) => cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0)
  let lo = -0.99
  let hi = 1
  let fLo = npv(lo)
  const fHi = npv(hi)
  if (Number.isNaN(fLo) || Number.isNaN(fHi) || fLo * fHi > 0) return null
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const fMid = npv(mid)
    if (Math.abs(fMid) < 1e-7) return mid
    if (fLo * fMid < 0) {
      hi = mid
    } else {
      lo = mid
      fLo = fMid
    }
  }
  return (lo + hi) / 2
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export function validate(plan: PlanSpec, input: CalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { age, sumAssured } = input

  if (plan.kind === 'CHILD') {
    const c = plan.child!
    if (age < c.minChildAge || age > c.maxChildAge)
      issues.push({ code: 'AGE_RANGE', params: { min: c.minChildAge, max: c.maxChildAge } })
    if (input.parentAge !== undefined && input.parentAge > c.maxParentAge)
      issues.push({ code: 'PARENT_AGE_MAX', params: { max: c.maxParentAge } })
  } else if (age < plan.minAge || age > plan.maxAge) {
    issues.push({ code: 'AGE_RANGE', params: { min: plan.minAge, max: plan.maxAge } })
  }

  if (plan.joint) {
    const s = input.spouseAge ?? 0
    if (s < plan.minAge || s > plan.maxAge)
      issues.push({ code: 'SPOUSE_AGE_RANGE', params: { min: plan.minAge, max: plan.maxAge } })
  }

  if (sumAssured < plan.minSA) issues.push({ code: 'SA_MIN', params: { min: plan.minSA } })
  if (sumAssured > plan.maxSA) issues.push({ code: 'SA_MAX', params: { max: plan.maxSA } })
  if (sumAssured % plan.saStep !== 0) issues.push({ code: 'SA_STEP', params: { step: plan.saStep } })

  switch (plan.term.type) {
    case 'maturityAge': {
      const term = (input.maturityAge ?? 0) - age
      if (term < 5) issues.push({ code: 'TERM_TOO_SHORT', params: { min: 5 } })
      break
    }
    case 'ceasingAge': {
      const ppt = (input.ceasingAge ?? 0) - age
      if (ppt < 5) issues.push({ code: 'TERM_TOO_SHORT', params: { min: 5 } })
      if (plan.kind === 'CWLA' && input.conversionYear) {
        const convAge = age + input.conversionYear
        if ((input.conversionMaturityAge ?? 0) - convAge < 5)
          issues.push({ code: 'CONVERSION_TERM', params: { min: 5 } })
      }
      break
    }
    case 'fixedTerm': {
      const term = input.term ?? 0
      if (!plan.term.options.includes(term)) issues.push({ code: 'TERM_RANGE' })
      const maxAge = plan.maxAgeByTerm?.[term]
      if (maxAge !== undefined && age > maxAge) issues.push({ code: 'AGE_FOR_TERM', params: { max: maxAge, term } })
      break
    }
    case 'termRange': {
      const term = input.term ?? 0
      if (term < plan.term.min || term > plan.term.max)
        issues.push({ code: 'TERM_RANGE', params: { min: plan.term.min, max: plan.term.max } })
      break
    }
  }
  return issues
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────

export function calculate(input: CalcInput): CalcResult {
  const plan = PLAN_BY_ID[input.planId]
  const issues = validate(plan, input)
  const { age, sumAssured, paymentMode, applySARebate } = input
  const SA = sumAssured

  // Term structure ----------------------------------------------------------
  let term = 0
  let premiumTerm = 0
  let maturityAge = 0
  let rate = 0
  let conversionYear = 0
  let rateAfterConversion = 0

  switch (plan.kind) {
    case 'EA': {
      maturityAge = input.maturityAge ?? 60
      term = Math.max(1, maturityAge - age)
      premiumTerm = term
      rate = endowmentRate(plan.product, age, maturityAge, plan.bonusRate)
      break
    }
    case 'WLA': {
      const ceasingAge = input.ceasingAge ?? 60
      maturityAge = WHOLE_LIFE_MATURITY_AGE
      term = Math.max(1, maturityAge - age)
      premiumTerm = Math.max(1, ceasingAge - age)
      rate = wholeLifeRate(plan.product, age, ceasingAge, plan.bonusRate)
      break
    }
    case 'CWLA': {
      const ceasingAge = input.ceasingAge ?? 60
      rate = wholeLifeRate(plan.product, age, ceasingAge, plan.bonusRate)
      conversionYear = input.conversionYear ?? 0
      if (conversionYear > 0) {
        const convAge = age + conversionYear
        maturityAge = input.conversionMaturityAge ?? 60
        term = Math.max(conversionYear + 1, maturityAge - age)
        premiumTerm = term
        rateAfterConversion = endowmentRate(
          plan.product,
          convAge,
          maturityAge,
          plan.bonusRateAfterConversion ?? plan.bonusRate,
        )
      } else {
        maturityAge = WHOLE_LIFE_MATURITY_AGE
        term = Math.max(1, maturityAge - age)
        premiumTerm = Math.max(1, ceasingAge - age)
      }
      break
    }
    case 'AEA': {
      term = input.term ?? (plan.term.type === 'fixedTerm' ? plan.term.options[0] : 15)
      premiumTerm = term
      maturityAge = age + term
      rate = anticipatedRate(plan.product, age, term, plan.moneyBack?.[term] ?? [], plan.bonusRate)
      break
    }
    case 'JOINT': {
      term = input.term ?? 20
      premiumTerm = term
      maturityAge = age + term
      rate = jointLifeRate(plan.product, age, input.spouseAge ?? age, term, plan.bonusRate)
      break
    }
    case 'CHILD': {
      term = input.term ?? 15
      premiumTerm = term
      maturityAge = age + term
      rate = childRate(plan.product, age, term, plan.bonusRate)
      break
    }
  }

  const premium = buildPremium(rate, SA, paymentMode, applySARebate, plan.product)
  const premiumAfterConversion =
    conversionYear > 0 ? buildPremium(rateAfterConversion, SA, paymentMode, applySARebate, plan.product) : undefined

  // Bonus -------------------------------------------------------------------
  const bonusRate = plan.bonusRate
  const bonusRate2 = plan.bonusRateAfterConversion ?? bonusRate
  const bonusPerYear = (SA / 1000) * bonusRate
  const bonusPerYear2 = (SA / 1000) * bonusRate2
  // Bonus fractions of 50 paise and above round up to the next rupee
  const accruedBonusAt = (year: number) =>
    r0(
      conversionYear > 0
        ? Math.min(year, conversionYear) * bonusPerYear + Math.max(0, year - conversionYear) * bonusPerYear2
        : year * bonusPerYear,
    )
  const totalBonus = accruedBonusAt(term)
  const terminalBonus = terminalBonusFor(plan.kind, SA, term)

  // Money-back schedule -----------------------------------------------------
  const moneyBack = plan.kind === 'AEA' ? (plan.moneyBack?.[term] ?? []) : []
  const inflowByYear = new Map<number, { amount: number; pct?: number; bonusPart?: number }>()
  const milestones: Milestone[] = []
  let survivalPaid = 0

  if (moneyBack.length) {
    for (const step of moneyBack) {
      const base = (SA * step.pct) / 100
      const isFinal = step.year === term
      const bonusPart = isFinal ? totalBonus : 0
      const amount = base + bonusPart
      inflowByYear.set(step.year, { amount, pct: step.pct, bonusPart })
      if (!isFinal) survivalPaid += base
      milestones.push({
        year: step.year,
        age: age + step.year,
        kind: isFinal ? 'maturity' : 'survival',
        pct: step.pct,
        amount,
        bonusPart,
      })
    }
  } else {
    const finalAmount = SA + totalBonus + terminalBonus
    inflowByYear.set(term, { amount: finalAmount, bonusPart: totalBonus + terminalBonus })
    if (conversionYear > 0) {
      milestones.push({ year: conversionYear, age: age + conversionYear, kind: 'conversion', amount: 0 })
    }
    if (premiumTerm < term) {
      // Whole life: show the value accrued when premiums stop (life cover at that point)
      milestones.push({
        year: premiumTerm,
        age: age + premiumTerm,
        kind: 'premiumEnd',
        amount: SA + accruedBonusAt(premiumTerm),
        bonusPart: accruedBonusAt(premiumTerm),
      })
    }
    milestones.push({
      year: term,
      age: age + term,
      kind: 'maturity',
      amount: finalAmount,
      bonusPart: totalBonus + terminalBonus,
    })
  }
  milestones.sort((a, b) => a.year - b.year)

  const finalPayout = inflowByYear.get(term)?.amount ?? 0
  const totalBenefit = survivalPaid + finalPayout

  // Year-wise projection ----------------------------------------------------
  const years: YearRow[] = []
  let cumulative = 0
  let basePremiums = 0
  let gstTotal = 0
  const yearlyOutgo: number[] = []
  for (let y = 1; y <= term; y++) {
    const paying = y <= premiumTerm
    const p = conversionYear > 0 && y > conversionYear && premiumAfterConversion ? premiumAfterConversion : premium
    const base = paying ? p.modal * p.instalmentsPerYear : 0
    const gstRate = y === 1 ? CONFIG.gst.firstYear : CONFIG.gst.renewal
    const gst = paying ? r2(base * gstRate) : 0
    const total = r2(base + gst)
    cumulative = r2(cumulative + total)
    basePremiums += base
    gstTotal += gst
    yearlyOutgo.push(total)
    const accrued = accruedBonusAt(y)
    years.push({
      year: y,
      age: age + y,
      base,
      gst,
      total,
      cumulative,
      inflow: inflowByYear.get(y)?.amount ?? 0,
      accruedBonus: accrued,
      lifeCover: SA + accrued,
    })
  }
  basePremiums = r2(basePremiums)
  gstTotal = r2(gstTotal)
  const outgo = r2(basePremiums + gstTotal)

  // Returns -----------------------------------------------------------------
  // Premiums are paid at the start of each policy year (t = y-1); benefits at the end (t = y).
  const cashflows = new Array<number>(term + 1).fill(0)
  for (let y = 1; y <= term; y++) {
    cashflows[y - 1] -= yearlyOutgo[y - 1]
    cashflows[y] += inflowByYear.get(y)?.amount ?? 0
  }
  const roi = outgo > 0 ? (totalBenefit - outgo) / outgo : 0
  const annualised = irr(cashflows)

  // Surrender & loan (indicative) -------------------------------------------
  const schedule: LoanRow[] = []
  const loanAllowed = plan.loanAfterYears !== null
  const scheduleStart = plan.loanAfterYears ?? plan.surrenderAfterYears ?? Number.POSITIVE_INFINITY
  for (let y = scheduleStart; y <= Math.min(term, premiumTerm); y++) {
    const paidUpValue = r0((SA * y) / premiumTerm)
    const vestedBonus = y >= plan.bonusVestingYears ? accruedBonusAt(y) : 0
    const progress = premiumTerm > scheduleStart ? (y - scheduleStart) / (premiumTerm - scheduleStart) : 1
    const factor = 0.3 + 0.6 * Math.min(1, Math.max(0, progress))
    const basisA = factor * (paidUpValue + vestedBonus)
    const paidSoFar = years.slice(0, y).reduce((s, r) => s + r.base, 0)
    const basisB = 0.3 * Math.max(0, paidSoFar - (years[0]?.base ?? 0))
    const surrenderValue = r0(Math.max(basisA, basisB))
    schedule.push({
      year: y,
      paidUpValue,
      surrenderValue,
      loanValue: loanAllowed ? r0(surrenderValue * CONFIG.loan.pctOfSurrender) : 0,
    })
  }

  return {
    plan,
    input,
    issues,
    term,
    premiumTerm,
    maturityAge,
    premium,
    premiumAfterConversion,
    years,
    totals: { basePremiums, gst: gstTotal, outgo },
    bonus: {
      rate: bonusRate,
      rateAfterConversion: conversionYear > 0 ? bonusRate2 : undefined,
      total: totalBonus,
      terminal: terminalBonus,
    },
    maturity: {
      sumAssured: SA,
      survivalPaid,
      finalPayout,
      totalBenefit,
      netGain: r2(totalBenefit - outgo),
      accruedValueAtPremiumEnd: premiumTerm < term ? SA + accruedBonusAt(premiumTerm) : undefined,
    },
    milestones,
    returns: { roi, irr: annualised },
    loan: { eligibleAfterYears: plan.loanAfterYears, schedule },
    medical: (() => {
      // Children policies need no medical for the child; underwriting is on the parent
      const proposerAge = plan.kind === 'CHILD' ? (input.parentAge ?? age) : age
      const limit = nonMedicalLimit(plan.product, proposerAge)
      return { required: plan.kind === 'AEA' || SA > limit, nonMedicalLimit: limit }
    })(),
  }
}

/** Sensible default inputs for a plan. */
export function defaultInputFor(plan: PlanSpec, base?: Partial<CalcInput>): CalcInput {
  const isChild = plan.kind === 'CHILD'
  const age = isChild ? 10 : 30
  const input: CalcInput = {
    age,
    sumAssured: Math.min(Math.max(plan.product === 'PLI' ? 500_000 : 200_000, plan.minSA), plan.maxSA),
    paymentMode: 'monthly',
    applySARebate: CONFIG.saRebate.enabled,
    ...base,
    planId: plan.id,
  }
  if (plan.joint) input.spouseAge = input.spouseAge ?? 28
  if (isChild) input.parentAge = input.parentAge ?? 35
  switch (plan.term.type) {
    case 'maturityAge':
      input.maturityAge = plan.term.options.includes(input.maturityAge ?? -1) ? input.maturityAge : 60
      break
    case 'ceasingAge':
      input.ceasingAge = plan.term.options.includes(input.ceasingAge ?? -1) ? input.ceasingAge : 60
      if (plan.kind === 'CWLA') {
        input.conversionYear = input.conversionYear ?? 0
        input.conversionMaturityAge = input.conversionMaturityAge ?? 60
      }
      break
    case 'fixedTerm':
      input.term = plan.term.options.includes(input.term ?? -1) ? input.term : plan.term.options[0]
      break
    case 'termRange':
      input.term =
        input.term !== undefined && input.term >= plan.term.min && input.term <= plan.term.max
          ? input.term
          : plan.term.default
      break
  }
  if (input.sumAssured > plan.maxSA) input.sumAssured = plan.maxSA
  if (input.sumAssured < plan.minSA) input.sumAssured = plan.minSA
  if (isChild && input.age > 20) input.age = 10
  return input
}

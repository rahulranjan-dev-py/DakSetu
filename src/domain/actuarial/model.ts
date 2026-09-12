import type { ActuarialAssumptions, MortalityLaw } from './assumptions.ts'
import { WHOLE_LIFE_MATURITY_AGE } from './assumptions.ts'

/** Force of mortality at exact age x. */
export function hazard(age: number, law: MortalityLaw): number {
  return law.A + law.B * Math.pow(law.c, age)
}

/** One-year probability of death for a life aged x. */
export function qx(age: number, law: MortalityLaw, factor = 1): number {
  return 1 - Math.exp(-hazard(age, law) * factor)
}

/**
 * Survival curve for one or more lives (joint-life status: cover ends on the
 * first death). Returns kp for k = 0..n.
 */
export function survivalCurve(
  ages: number[],
  n: number,
  law: MortalityLaw,
  factor = 1,
): number[] {
  const out = [1]
  let p = 1
  for (let k = 0; k < n; k++) {
    let mu = 0
    for (const a of ages) mu += hazard(a + k, law) * factor
    p *= Math.exp(-mu)
    out.push(p)
  }
  return out
}

export interface BenefitSpec {
  /** Number of years premiums are payable */
  premiumTerm: number
  /** Number of years the cover / accumulation runs */
  coverTerm: number
  /** Benefit per ₹1,000 SA paid at the end of the policy year of death (year 1-based) */
  death: (year: number) => number
  /** Survival / maturity benefits per ₹1,000 SA paid at the end of the given policy year */
  survival: Array<{ year: number; amount: number }>
  /** Lives insured (age next birthday) */
  ages: number[]
  /** Mortality multiplier (e.g. juvenile lives) */
  mortalityFactor?: number
  /** Extra proportional loading for this contract type */
  extraLoading?: number
}

/**
 * Net annual premium per ₹1,000 SA using the equivalence principle:
 *   P · ä(x:m) = APV(death benefits) + APV(survival benefits)
 */
export function netAnnualPremiumPer1000(spec: BenefitSpec, a: ActuarialAssumptions): number {
  const v = 1 / (1 + a.interest)
  const factor = spec.mortalityFactor ?? 1
  const p = survivalCurve(spec.ages, spec.coverTerm, a.mortality, factor)

  let apvBenefits = 0
  for (let k = 0; k < spec.coverTerm; k++) {
    const qJoint = 1 - p[k + 1] / p[k]
    apvBenefits += Math.pow(v, k + 1) * p[k] * qJoint * spec.death(k + 1)
  }
  for (const s of spec.survival) {
    apvBenefits += Math.pow(v, s.year) * p[s.year] * s.amount
  }

  let annuity = 0
  for (let k = 0; k < spec.premiumTerm; k++) annuity += Math.pow(v, k) * p[k]

  return apvBenefits / annuity
}

/** Gross monthly office premium per ₹1,000 SA, rounded to the paisa. */
export function grossMonthlyRatePer1000(spec: BenefitSpec, a: ActuarialAssumptions): number {
  const net = netAnnualPremiumPer1000(spec, a)
  const loading = a.expenseLoading + (spec.extraLoading ?? 0)
  const grossAnnual = net * (1 + loading) + a.fixedLoadingPer1000
  return Math.round((grossAnnual / 12) * 100) / 100
}

// ---------------------------------------------------------------------------
// Benefit builders for each India Post product family
// ---------------------------------------------------------------------------

/** Endowment Assurance (Santosh / Gram Santosh) – SA + accrued bonus at maturity or death. */
export function endowmentSpec(age: number, term: number, bonusRate: number): BenefitSpec {
  return {
    ages: [age],
    premiumTerm: term,
    coverTerm: term,
    death: (y) => 1000 + bonusRate * y,
    survival: [{ year: term, amount: 1000 + bonusRate * term }],
  }
}

/** Whole Life Assurance (Suraksha / Gram Suraksha) – SA + bonus at 80 or earlier death; premiums cease at 55/58/60. */
export function wholeLifeSpec(age: number, ceasingAge: number, bonusRate: number): BenefitSpec {
  const coverTerm = WHOLE_LIFE_MATURITY_AGE - age
  return {
    ages: [age],
    premiumTerm: ceasingAge - age,
    coverTerm,
    death: (y) => 1000 + bonusRate * y,
    survival: [{ year: coverTerm, amount: 1000 + bonusRate * coverTerm }],
  }
}

/** Anticipated Endowment (Sumangal / Gram Sumangal / Gram Priya) – money-back instalments + final instalment with bonus. */
export function anticipatedSpec(
  age: number,
  term: number,
  schedule: Array<{ year: number; pct: number }>,
  bonusRate: number,
): BenefitSpec {
  const survival = schedule.map((s) => ({
    year: s.year,
    amount: s.year === term ? s.pct * 10 + bonusRate * term : s.pct * 10,
  }))
  return {
    ages: [age],
    premiumTerm: term,
    coverTerm: term,
    // Full SA + accrued bonus on death irrespective of survival benefits already paid
    death: (y) => 1000 + bonusRate * y,
    survival,
  }
}

/** Joint Life Endowment (Yugal Suraksha) – SA + bonus on first death or maturity. */
export function jointLifeSpec(
  age1: number,
  age2: number,
  term: number,
  bonusRate: number,
  a: ActuarialAssumptions,
): BenefitSpec {
  return {
    ages: [age1, age2],
    premiumTerm: term,
    coverTerm: term,
    death: (y) => 1000 + bonusRate * y,
    survival: [{ year: term, amount: 1000 + bonusRate * term }],
    extraLoading: a.jointLoading,
  }
}

/** Children Policy (Bal Jeevan Bima) – endowment on the child's life with premium waiver on parent's death. */
export function childSpec(
  childAge: number,
  term: number,
  bonusRate: number,
  a: ActuarialAssumptions,
): BenefitSpec {
  return {
    ages: [childAge],
    premiumTerm: term,
    coverTerm: term,
    death: (y) => 1000 + bonusRate * y,
    survival: [{ year: term, amount: 1000 + bonusRate * term }],
    mortalityFactor: a.childMortalityFactor,
    extraLoading: a.childWaiverLoading,
  }
}

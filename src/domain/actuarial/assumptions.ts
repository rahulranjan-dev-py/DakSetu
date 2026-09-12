/**
 * Actuarial assumptions used to build the offline premium tables.
 *
 * India Post publishes premium rate charts (per ₹1,000 sum assured, per month,
 * by age next birthday and term). The exact charts are periodically revised by
 * the Directorate of Postal Life Insurance. The tables shipped with Postal Mitra
 * are a calibrated actuarial baseline that reproduces the shape and level of the
 * standard charts; drop official values into `rate-overrides.ts` to replace any
 * cell with the exact published figure.
 *
 * Mortality follows a Gompertz–Makeham law  μ(x) = A + B·cˣ  fitted to Indian
 * assured-lives experience; premiums are net premiums at the valuation rate of
 * interest plus a proportional expense loading, quoted per month per ₹1,000.
 */
export interface MortalityLaw {
  /** Makeham constant (accident hazard) */
  A: number
  /** Gompertz scale */
  B: number
  /** Gompertz growth rate */
  c: number
}

export interface ActuarialAssumptions {
  /** Valuation rate of interest (annual effective) */
  interest: number
  /** Proportional expense loading applied to the net annual premium */
  expenseLoading: number
  /** Fixed per-policy loading per ₹1,000 SA per year (₹) */
  fixedLoadingPer1000: number
  /** Mortality law for adult lives */
  mortality: MortalityLaw
  /** Multiplier applied to the hazard for juvenile lives (child policies) */
  childMortalityFactor: number
  /** Extra proportional loading for premium waiver on child policies */
  childWaiverLoading: number
  /** Extra proportional loading on joint-life (two lives covered) */
  jointLoading: number
}

export const PLI_ASSUMPTIONS: ActuarialAssumptions = {
  interest: 0.0675,
  expenseLoading: 0.07,
  fixedLoadingPer1000: 0.4,
  mortality: { A: 0.0004, B: 0.000045, c: 1.094 },
  childMortalityFactor: 0.6,
  childWaiverLoading: 0.03,
  jointLoading: 0.02,
}

export const RPLI_ASSUMPTIONS: ActuarialAssumptions = {
  interest: 0.07,
  expenseLoading: 0.05,
  fixedLoadingPer1000: 0.3,
  mortality: { A: 0.0004, B: 0.000045, c: 1.094 },
  childMortalityFactor: 0.6,
  childWaiverLoading: 0.03,
  jointLoading: 0.02,
}

/** Age at which whole life assurance policies mature (PLI & RPLI). */
export const WHOLE_LIFE_MATURITY_AGE = 80

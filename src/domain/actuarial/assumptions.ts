/**
 * Actuarial assumptions used to build the offline premium tables.
 *
 * India Post publishes premium rate charts (per ₹1,000 sum assured, per month,
 * by age next birthday and term). The exact charts are periodically revised by
 * the Directorate of Postal Life Insurance. The tables shipped with DakSetu
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

/**
 * Calibrated against India Post-linked Santosh (EA) premium figures:
 *   age 26 / maturity 50 → ₹3.20 per ₹1,000 per month
 *   age 27 / maturity 35 → ₹10.60 per ₹1,000 per month
 * (both cells are also pinned exactly in rate-overrides.ts).
 */
export const PLI_ASSUMPTIONS: ActuarialAssumptions = {
  interest: 0.0725,
  expenseLoading: 0.01,
  fixedLoadingPer1000: 1.9,
  mortality: { A: 0.0004, B: 0.000045, c: 1.094 },
  childMortalityFactor: 0.6,
  childWaiverLoading: 0.03,
  jointLoading: 0.02,
}

/** RPLI premiums run a little below PLI for the same benefit (lower rural distribution cost). */
export const RPLI_ASSUMPTIONS: ActuarialAssumptions = {
  interest: 0.075,
  expenseLoading: 0.01,
  fixedLoadingPer1000: 1.6,
  mortality: { A: 0.0004, B: 0.000045, c: 1.094 },
  childMortalityFactor: 0.6,
  childWaiverLoading: 0.03,
  jointLoading: 0.02,
}

/** Age at which whole life assurance policies mature (PLI & RPLI). */
export const WHOLE_LIFE_MATURITY_AGE = 80

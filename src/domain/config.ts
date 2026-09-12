import type { Config } from './types.ts'

/**
 * Business rules that India Post revises from time to time. Everything here is
 * intentionally a plain constant so a Divisional office can update it without
 * touching the calculation engine.
 */
export const CONFIG: Config = {
  gst: {
    /** GST on 1st-year premium */
    firstYear: 0.045,
    /** GST on renewal premium (2nd year onwards) */
    renewal: 0.0225,
  },
  saRebate: {
    /** Toggle default for the high sum assured rebate */
    enabled: true,
    /** Rebate applies to sum assured above this amount */
    threshold: 100_000,
    /** ₹1.00 per month for every ₹20,000 of SA above the threshold */
    step: 20_000,
    amountPerStep: 1,
  },
  /** Advance premium rebate: 6 months = 1 %, 12 months = 2 % */
  modeRebate: { monthly: 0, quarterly: 0, halfYearly: 0.01, yearly: 0.02 },
  modeMultiplier: { monthly: 1, quarterly: 3, halfYearly: 6, yearly: 12 },
  instalmentsPerYear: { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 },
  loan: {
    /** Loan is sanctioned up to ~90 % of the surrender value */
    pctOfSurrender: 0.9,
  },
  lateFee: {
    /** Default fee: ₹1 per ₹100 of premium (or part thereof) per month of default */
    ratePer100PerMonth: 1,
    /** Policy lapses after these many unpaid months if less than 3 years old */
    lapseMonthsUnder3Years: 6,
    /** ... or after these many unpaid months once 3 years old */
    lapseMonthsAfter3Years: 12,
  },
}

/** Quick-pick sum assured chips (₹). */
export const SA_PRESETS = [50_000, 100_000, 500_000, 1_000_000, 2_000_000, 5_000_000]

import type { Config } from './types.ts'

/**
 * Business rules that India Post revises from time to time. Everything here is
 * intentionally a plain constant so a Divisional office can update it without
 * touching the calculation engine.
 */
export const CONFIG: Config = {
  gst: {
    /**
     * Individual life insurance premiums are fully GST-exempt (NIL rate) from
     * 22 September 2025 – CBIC Notification No. 16/2025-Central Tax (Rate),
     * following the 56th GST Council meeting.
     */
    firstYear: 0,
    renewal: 0,
    exemptFrom: '2025-09-22',
    /** Rates that applied under Rule 32(4) CGST Rules from 1 July 2017 to 21 Sept 2025 */
    legacy: { firstYear: 0.045, renewal: 0.0225 },
  },
  saRebate: {
    /** Toggle default for the high sum assured rebate */
    enabled: true,
    /** ₹1.00 per month once the sum assured reaches this amount … */
    minSA: 40_000,
    baseAmount: 1,
    /** … plus ₹1.00 per month for every further tier of this size */
    step: 20_000,
    amountPerStep: 1,
  },
  /** Advance premium rebate (Rule 12): 3 months 0.5 %, 6 months 1 %, 12 months 2 % */
  modeRebate: { monthly: 0, quarterly: 0.005, halfYearly: 0.01, yearly: 0.02 },
  modeMultiplier: { monthly: 1, quarterly: 3, halfYearly: 6, yearly: 12 },
  instalmentsPerYear: { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 },
  terminalBonus: {
    /** ₹20 per ₹10,000 SA … */
    per10000: 20,
    /** … capped per policy */
    cap: 1_000,
    /** only on policies that run for at least this many years */
    minTerm: 20,
    /** only Whole Life and Endowment contracts qualify */
    kinds: ['WLA', 'EA', 'CWLA'],
  },
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
    /** Revival of a lapsed policy: arrears carry compound interest of 10–12 % p.a. */
    revivalInterestRate: 0.12,
  },
}

/** Quick-pick sum assured chips (₹). */
export const SA_PRESETS = [50_000, 100_000, 500_000, 1_000_000, 2_000_000, 5_000_000]

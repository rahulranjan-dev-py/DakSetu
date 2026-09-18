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
    /**
     * ₹1.00 per month for every ₹20,000 of sum assured (e.g. SA ₹5,10,000 → ₹25,
     * SA ₹7,00,000 → ₹35), scaled ×3 / ×6 / ×12 for the other modes.
     */
    minSA: 20_000,
    baseAmount: 1,
    step: 20_000,
    amountPerStep: 1,
    /** Joint life (Yugal Suraksha): Dak Sewa quotes ₹7 on ₹1,00,000 instead of ₹5 – verified at ₹1,00,000 only */
    jointMultiplier: 1.4,
  },
  /**
   * Modal premiums as quoted by the Dak Sewa app (age 29, all plans, SA ₹1L/₹5L):
   *  - PLI: quarterly ≈ monthly × 3 (−0.2 %), half-yearly = monthly × 6 − 1.45 %,
   *    yearly = monthly × 12 − 2.95 % (percentages vary slightly with term)
   *  - RPLI: quarterly = monthly × 3 − ₹0.15 per ₹1,000 SA, half-yearly = × 6 − ₹0.55,
   *    yearly = × 12 − ₹2.05 per ₹1,000 SA (flat, independent of term)
   */
  modeAdjustment: {
    PLI: {
      type: 'pct',
      discountByTerm: {
        monthly: { 0: 0 },
        quarterly: { 6: 0.0023, 16: 0.0013, 26: 0.0022, 29: 0, 31: 0 },
        halfYearly: { 6: 0.0148, 21: 0.0149, 26: 0.0144, 29: 0.0141, 31: 0.0141 },
        yearly: { 6: 0.03, 11: 0.0298, 26: 0.0294, 29: 0.0295, 31: 0.0295 },
      },
    },
    RPLI: {
      type: 'per1000',
      deductionPer1000: { monthly: 0, quarterly: 0.15, halfYearly: 0.55, yearly: 2.05 },
    },
  },
  modeMultiplier: { monthly: 1, quarterly: 3, halfYearly: 6, yearly: 12 },
  instalmentsPerYear: { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 },
  terminalBonus: {
    /** ₹20 per ₹10,000 SA … */
    per10000: 20,
    /** … capped per policy */
    cap: 1_000,
    /** only on policies that run for at least this many years */
    minTerm: 20,
    /** Dak Sewa footnote: "in case of Endowment Assurance" – WLA does not qualify */
    kinds: ['EA', 'CWLA'],
  },
  loan: {
    /** Loan is sanctioned up to ~90 % of the surrender value */
    pctOfSurrender: 0.9,
    /** Loan interest 10 % p.a., calculated half-yearly */
    interestRate: 0.1,
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
    /** Revival is allowed any number of times within 5 years of the first unpaid premium */
    revivalWindowYears: 5,
  },
  rpliNonStandardAgeProof: {
    /** Dak Sewa: "Non standard age proof attracts extra 5.00 % premium" – applied to the tabular premium */
    loading: 0.05,
    /** Entry limited to age 45 without standard age proof */
    maxAge: 45,
  },
  medical: {
    /** PLI: non-medical up to ₹2 lakh at any age, up to ₹5 lakh if aged ≤ 40 */
    PLI: { nonMedicalAnyAge: 200_000, nonMedicalUpToAge: 500_000, nonMedicalUpToAgeLimit: 40 },
    /** RPLI: non-medical up to ₹1 lakh if aged ≤ 35 */
    RPLI: { nonMedicalAnyAge: 0, nonMedicalUpToAge: 100_000, nonMedicalUpToAgeLimit: 35 },
  },
}

/** Quick-pick sum assured chips (₹). */
export const SA_PRESETS = [50_000, 100_000, 500_000, 1_000_000, 2_000_000, 5_000_000]

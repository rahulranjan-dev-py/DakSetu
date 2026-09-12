export type Product = 'PLI' | 'RPLI'

/** Contract family – drives the benefit structure & rate table used. */
export type PlanKind = 'WLA' | 'EA' | 'CWLA' | 'AEA' | 'JOINT' | 'CHILD'

export type PlanId =
  | 'pli-suraksha'
  | 'pli-santosh'
  | 'pli-suvidha'
  | 'pli-sumangal'
  | 'pli-yugal-suraksha'
  | 'pli-bal-jeevan'
  | 'rpli-gram-suraksha'
  | 'rpli-gram-santosh'
  | 'rpli-gram-suvidha'
  | 'rpli-gram-sumangal'
  | 'rpli-gram-priya'
  | 'rpli-bal-jeevan'

export type PaymentMode = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly'

export type Lang = 'en' | 'hi'
export type LocalizedText = Record<Lang, string>

export interface MoneyBackStep {
  /** Policy year at the end of which the instalment is paid */
  year: number
  /** Percentage of sum assured */
  pct: number
}

/** How the policy term is chosen for a plan. */
export type TermSelector =
  | { type: 'maturityAge'; options: number[] }
  | { type: 'ceasingAge'; options: number[] }
  | { type: 'fixedTerm'; options: number[] }
  | { type: 'termRange'; min: number; max: number; default: number }

export interface PlanSpec {
  id: PlanId
  product: Product
  kind: PlanKind
  /** Short code as printed on India Post literature (e.g. WLA, EA) */
  code: string
  name: LocalizedText
  tagline: LocalizedText
  /** lucide icon name used by the plan card */
  icon: 'Shield' | 'Smile' | 'RefreshCw' | 'Coins' | 'HeartHandshake' | 'Baby' | 'CalendarClock'
  minAge: number
  maxAge: number
  minSA: number
  maxSA: number
  /** Sum assured must be a multiple of this */
  saStep: number
  /** Simple reversionary bonus per ₹1,000 SA per year (last declared) */
  bonusRate: number
  /** For convertible plans: bonus rate after conversion to endowment */
  bonusRateAfterConversion?: number
  term: TermSelector
  /** Money-back schedule keyed by term (AEA plans) */
  moneyBack?: Record<number, MoneyBackStep[]>
  /** Entry-age caps keyed by term (AEA plans) */
  maxAgeByTerm?: Record<number, number>
  /** Policy loan available after this many years of premium payment (null = loans not permitted) */
  loanAfterYears: number | null
  /** Surrender allowed after this many years (null = surrender not permitted) */
  surrenderAfterYears: number | null
  /** Bonus is credited on surrender / paid-up only after this many years */
  bonusVestingYears: number
  /** Convertible whole life: window in which conversion may be exercised */
  conversionWindow?: { earliestYear: number; latestYear: number }
  /** Children policy constraints */
  child?: { minChildAge: number; maxChildAge: number; maxParentAge: number }
  /** Joint-life: both lives must be within entry ages */
  joint?: boolean
  /** Extra features shown on the plan card */
  features: LocalizedText[]
}

export interface Config {
  gst: {
    firstYear: number
    renewal: number
    /** ISO date from which individual life insurance premiums are GST-exempt */
    exemptFrom: string
    legacy: { firstYear: number; renewal: number }
  }
  saRebate: { enabled: boolean; minSA: number; baseAmount: number; step: number; amountPerStep: number }
  /**
   * How the official quarterly / half-yearly / yearly tabular premium relates to
   * monthly × instalments (from Dak Sewa quotations):
   *  - PLI: a percentage discount, keyed by policy term (interpolated)
   *  - RPLI: a flat deduction of ₹ per ₹1,000 sum assured per instalment
   */
  modeAdjustment: {
    PLI: { type: 'pct'; discountByTerm: Record<PaymentMode, Record<number, number>> }
    RPLI: { type: 'per1000'; deductionPer1000: Record<PaymentMode, number> }
  }
  modeMultiplier: Record<PaymentMode, number>
  instalmentsPerYear: Record<PaymentMode, number>
  /** Terminal bonus (Endowment only) – quoted as an addition, not part of the maturity amount */
  terminalBonus: { per10000: number; cap: number; minTerm: number; kinds: PlanKind[] }
  loan: { pctOfSurrender: number; interestRate: number }
  lateFee: {
    ratePer100PerMonth: number
    lapseMonthsUnder3Years: number
    lapseMonthsAfter3Years: number
    revivalInterestRate: number
    /** Revival is not possible once this many years have passed since the first unpaid premium */
    revivalWindowYears: number
  }
  /** RPLI: extra premium when only non-standard age proof is available, and the entry-age cap that applies */
  rpliNonStandardAgeProof: { loading: number; maxAge: number }
  /** Non-medical underwriting thresholds */
  medical: Record<Product, { nonMedicalAnyAge: number; nonMedicalUpToAge: number; nonMedicalUpToAgeLimit: number }>
}

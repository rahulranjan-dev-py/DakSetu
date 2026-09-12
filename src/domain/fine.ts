import { CONFIG } from './config.ts'

export interface FineInput {
  /** Premium per instalment (₹, excluding GST) */
  premium: number
  /** Number of unpaid instalments (months for monthly mode) */
  monthsOverdue: number
  /** Number of instalments outstanding */
  instalmentsDue: number
  /** Has the policy completed 3 years? (affects lapse threshold) */
  policyOverThreeYears: boolean
}

export interface FineResult {
  feePerInstalmentPerMonth: number
  totalFee: number
  arrears: number
  gstOnArrears: number
  totalPayable: number
  lapseAfterMonths: number
  lapsed: boolean
  monthsToLapse: number
}

/**
 * Default fee (late fee) on PLI/RPLI premium: ₹1 per ₹100 of premium (or part
 * thereof) per month of default. Each unpaid instalment attracts fee for the
 * months it remained unpaid – we approximate as an arithmetic series for
 * consecutive missed instalments.
 */
export function calculateFine(input: FineInput): FineResult {
  const { premium, monthsOverdue, instalmentsDue, policyOverThreeYears } = input
  const feePerInstalmentPerMonth = Math.ceil(Math.max(0, premium) / 100) * CONFIG.lateFee.ratePer100PerMonth
  const n = Math.max(0, Math.floor(instalmentsDue))
  const m = Math.max(0, Math.floor(monthsOverdue))

  // Oldest instalment overdue m months, the next one m-1 … down to (m-n+1)
  let feeMonths = 0
  for (let i = 0; i < n; i++) feeMonths += Math.max(0, m - i)

  const totalFee = feePerInstalmentPerMonth * feeMonths
  const arrears = premium * n
  const gstOnArrears = Math.round(arrears * CONFIG.gst.renewal * 100) / 100
  const lapseAfterMonths = policyOverThreeYears
    ? CONFIG.lateFee.lapseMonthsAfter3Years
    : CONFIG.lateFee.lapseMonthsUnder3Years

  return {
    feePerInstalmentPerMonth,
    totalFee,
    arrears,
    gstOnArrears,
    totalPayable: Math.round((arrears + gstOnArrears + totalFee) * 100) / 100,
    lapseAfterMonths,
    lapsed: m >= lapseAfterMonths,
    monthsToLapse: Math.max(0, lapseAfterMonths - m),
  }
}

/** Whole months between a due date and a payment date (0 if paid within the due month). */
export function monthsBetween(due: Date, paid: Date): number {
  const months = (paid.getFullYear() - due.getFullYear()) * 12 + (paid.getMonth() - due.getMonth())
  return Math.max(0, months)
}

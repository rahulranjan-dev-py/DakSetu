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
  /** Compound interest on arrears charged on revival of a lapsed policy */
  revivalInterest: number
  revivalInterestRate: number
  /** Arrears + default fee (in force) or arrears + revival interest (lapsed), plus any GST */
  totalPayable: number
  lapseAfterMonths: number
  lapsed: boolean
  monthsToLapse: number
  /** Revival is only possible within 5 years of the first unpaid premium */
  revivable: boolean
  revivalWindowMonths: number
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
  const lapsed = m >= lapseAfterMonths

  // Revival: each outstanding instalment accrues compound interest for the months it was unpaid
  const rate = CONFIG.lateFee.revivalInterestRate
  let revivalInterest = 0
  for (let i = 0; i < n; i++) {
    const monthsOutstanding = Math.max(0, m - i)
    revivalInterest += premium * (Math.pow(1 + rate, monthsOutstanding / 12) - 1)
  }
  revivalInterest = Math.round(revivalInterest * 100) / 100

  const charges = lapsed ? revivalInterest : totalFee
  return {
    feePerInstalmentPerMonth,
    totalFee,
    arrears,
    gstOnArrears,
    revivalInterest,
    revivalInterestRate: rate,
    totalPayable: Math.round((arrears + gstOnArrears + charges) * 100) / 100,
    lapseAfterMonths,
    lapsed,
    monthsToLapse: Math.max(0, lapseAfterMonths - m),
    revivable: m < CONFIG.lateFee.revivalWindowYears * 12,
    revivalWindowMonths: CONFIG.lateFee.revivalWindowYears * 12,
  }
}

/** Whole months between a due date and a payment date (0 if paid within the due month). */
export function monthsBetween(due: Date, paid: Date): number {
  const months = (paid.getFullYear() - due.getFullYear()) * 12 + (paid.getMonth() - due.getMonth())
  return Math.max(0, months)
}

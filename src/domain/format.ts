const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatINR(n: number, opts: { decimals?: boolean; symbol?: boolean } = {}): string {
  const { decimals = false, symbol = true } = opts
  const body = decimals ? inr2.format(n) : inr.format(Math.round(n))
  return symbol ? `₹${body}` : body
}

/** ₹5,00,000 → "5 L", ₹1,00,00,000 → "1 Cr" */
export function formatShortINR(n: number, lang: 'en' | 'hi' = 'en'): string {
  const lakh = lang === 'hi' ? 'लाख' : 'L'
  const crore = lang === 'hi' ? 'करोड़' : 'Cr'
  const thousand = lang === 'hi' ? 'हज़ार' : 'K'
  if (n >= 1_00_00_000) return `₹${trim(n / 1_00_00_000)} ${crore}`
  if (n >= 1_00_000) return `₹${trim(n / 1_00_000)} ${lakh}`
  if (n >= 1_000) return `₹${trim(n / 1_000)} ${thousand}`
  return `₹${n}`
}

function trim(v: number): string {
  return (Math.round(v * 100) / 100).toString()
}

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

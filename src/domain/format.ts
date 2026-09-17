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

const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const HI_1_99 = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
]

function below100(n: number, lang: 'en' | 'hi'): string {
  if (lang === 'hi') return HI_1_99[n]
  if (n < 20) return EN_ONES[n]
  return `${EN_TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + EN_ONES[n % 10] : ''}`
}

function below1000(n: number, lang: 'en' | 'hi'): string {
  const h = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (h) parts.push(lang === 'hi' ? `${HI_1_99[h]} सौ` : `${EN_ONES[h]} Hundred`)
  if (rest) parts.push(below100(rest, lang))
  return parts.join(' ')
}

/**
 * Whole rupees in words using the Indian numbering system, e.g.
 * 5,00,000 → "Rupees Five Lakh Only" / "पाँच लाख रुपये मात्र".
 */
export function amountInWords(amount: number, lang: 'en' | 'hi' = 'en'): string {
  let n = Math.round(Math.abs(amount))
  if (n === 0) return lang === 'hi' ? 'शून्य रुपये' : 'Rupees Zero Only'
  const units: [number, string, string][] = [
    [1_00_00_000, 'Crore', 'करोड़'],
    [1_00_000, 'Lakh', 'लाख'],
    [1_000, 'Thousand', 'हज़ार'],
  ]
  const parts: string[] = []
  for (const [value, en, hi] of units) {
    const q = Math.floor(n / value)
    if (q) {
      parts.push(`${below1000(q, lang)} ${lang === 'hi' ? hi : en}`)
      n %= value
    }
  }
  if (n) parts.push(below1000(n, lang))
  const words = parts.join(' ')
  return lang === 'hi' ? `${words} रुपये मात्र` : `Rupees ${words} Only`
}

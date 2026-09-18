import type { CalcResult } from '@/domain/engine.ts'
import { amountInWords, formatINR } from '@/domain/format.ts'
import { CONFIG } from '@/domain/config.ts'
import type { Lang } from '@/domain/types.ts'
import { translate } from '@/i18n'
import { agentContactLine, type AgentProfile } from '@/features/agent/agent.ts'

export interface PitchContext {
  lang: Lang
  result: CalcResult
  customerName: string
  agent: AgentProfile
}

export function buildPitchMessage({ lang, result, customerName, agent }: PitchContext): string {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(lang, key, params)
  const plan = result.plan
  const name = customerName.trim() || (lang === 'hi' ? 'जी' : 'Sir/Madam')

  const survival = result.milestones.filter((m) => m.kind === 'survival')
  const moneyback = survival.length
    ? t('wa.moneyback', {
        list: survival
          .map((m) => `${lang === 'hi' ? 'वर्ष' : 'Yr'} ${m.year}: ${formatINR(m.amount)}`)
          .join(', '),
      })
    : ''

  const premium = result.premium.mode === 'monthly'
    ? formatINR(result.premium.totalFirstYear)
    : `${formatINR(result.premium.monthlyEquivalentFirstYear)} (${t(`mode.${result.premium.mode}`)} ${formatINR(result.premium.totalFirstYear)})`

  const body = t('wa.body', {
    plan: plan.name[lang],
    product: plan.product,
    sa: formatINR(result.maturity.sumAssured),
    saWords: amountInWords(result.maturity.sumAssured, lang),
    premium,
    term: result.term,
    maturity: formatINR(result.maturity.totalBenefit),
    moneyback,
    gstNote: CONFIG.gst.firstYear > 0 ? t('wa.gstNote') : t('wa.gstExempt'),
    agent: agentContactLine(agent) || (lang === 'hi' ? 'आपका नज़दीकी डाकघर' : 'your nearest Post Office'),
  })

  return `${t('wa.greeting', { name })}\n\n${body}\n\n_${t('wa.footer')}_`
}

export function whatsappUrl(message: string, phone?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  const normalised = digits.length === 10 ? `91${digits}` : digits
  const base = normalised ? `https://wa.me/${normalised}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(message)}`
}

/** Opens the chat with a number (no pre-filled text); without a number WhatsApp shows its contact picker. */
export function whatsappChatUrl(phone?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  const normalised = digits.length === 10 ? `91${digits}` : digits
  return normalised ? `https://wa.me/${normalised}` : 'https://wa.me/'
}

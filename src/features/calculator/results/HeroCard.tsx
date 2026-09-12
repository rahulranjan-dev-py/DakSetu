import { IndianRupee, Sparkles } from 'lucide-react'
import type { CalcResult, PremiumBreakdown } from '@/domain/engine.ts'
import { CONFIG } from '@/domain/config.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

const PER_KEY = {
  monthly: 'result.hero.perMonth',
  quarterly: 'result.hero.perQuarter',
  halfYearly: 'result.hero.perHalfYear',
  yearly: 'result.hero.perYear',
} as const

function Column({ label, p, gst, first }: { label: string; p: PremiumBreakdown; gst: number; first: boolean }) {
  const { t } = useI18n()
  const total = first ? p.totalFirstYear : p.totalRenewal
  const monthlyEq = first ? p.monthlyEquivalentFirstYear : p.monthlyEquivalentRenewal
  return (
    <div className={first ? '' : 'border-l border-white/15 pl-4'}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tabular tracking-tight sm:text-4xl">{formatINR(total, { decimals: total % 1 !== 0 })}</span>
      </div>
      <div className="text-xs text-white/75">{t(PER_KEY[p.mode])}</div>
      <div className="mt-1 text-[11px] text-white/60">{t('result.hero.inclGst', { pct: gst * 100 })}</div>
      {p.mode !== 'monthly' && (
        <div className="text-[11px] font-medium text-gold-300">{t('result.hero.monthlyEq', { amt: formatINR(monthlyEq) })}</div>
      )}
    </div>
  )
}

export function HeroCard({ result }: { result: CalcResult }) {
  const { t, l } = useI18n()
  const p = result.premium
  return (
    <section className="hero-gradient relative overflow-hidden rounded-2xl p-4 text-white shadow-hero sm:p-5" aria-label={t('result.hero.title')}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold-300">
            <IndianRupee size={14} /> {t('result.hero.title')}
          </div>
          <div className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            {l(result.plan.name)} · {result.plan.product}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Column label={t('result.hero.firstYear')} p={p} gst={CONFIG.gst.firstYear} first />
          <Column label={t('result.hero.renewal')} p={p} gst={CONFIG.gst.renewal} first={false} />
        </div>
        {result.premiumAfterConversion && (
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs">
            <span className="font-semibold text-gold-300">{t('result.hero.afterConversion')}:</span>{' '}
            <span className="tabular font-bold">{formatINR(result.premiumAfterConversion.totalRenewal, { decimals: true })}</span>{' '}
            <span className="text-white/70">{t(PER_KEY[p.mode])}</span>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/80">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-gold-300" />
            {t('result.bonusRateValue', { n: result.bonus.rate })}
          </span>
          <span>·</span>
          <span>
            {t('result.term')}: {result.term} {t('common.yrs')}
          </span>
          {result.premiumTerm !== result.term && (
            <>
              <span>·</span>
              <span>
                {t('result.premiumTerm')}: {result.premiumTerm} {t('common.yrs')}
              </span>
            </>
          )}
          <span>·</span>
          <span>
            {t('result.maturityAge')}: {result.maturityAge}
          </span>
        </div>
      </div>
    </section>
  )
}

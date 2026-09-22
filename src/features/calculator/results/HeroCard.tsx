import { IndianRupee, Sparkles } from 'lucide-react'
import type { CalcResult, PremiumBreakdown } from '@/domain/engine.ts'
import { CONFIG } from '@/domain/config.ts'
import { amountInWords, formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

const PER_KEY = {
  monthly: 'result.hero.perMonth',
  quarterly: 'result.hero.perQuarter',
  halfYearly: 'result.hero.perHalfYear',
  yearly: 'result.hero.perYear',
} as const

function Column({
  label,
  p,
  total,
  monthlyEq,
  note,
  divider,
}: {
  label: string
  p: PremiumBreakdown
  total: number
  monthlyEq: number
  note: string
  divider?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className={divider ? 'border-l border-white/15 pl-4' : ''}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tabular tracking-tight sm:text-4xl">{formatINR(total, { decimals: total % 1 !== 0 })}</span>
      </div>
      <div className="text-xs text-white/75">{t(PER_KEY[p.mode])}</div>
      <div className="mt-1 text-[11px] text-white/60">{note}</div>
      {p.mode !== 'monthly' && (
        <div className="text-[11px] font-medium text-gold-300">{t('result.hero.monthlyEq', { amt: formatINR(monthlyEq) })}</div>
      )}
    </div>
  )
}

export function HeroCard({ result }: { result: CalcResult }) {
  const { t, lang, l } = useI18n()
  const p = result.premium
  const gstApplies = CONFIG.gst.firstYear > 0 || CONFIG.gst.renewal > 0

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

        {gstApplies ? (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Column
              label={t('result.hero.firstYear')}
              p={p}
              total={p.totalFirstYear}
              monthlyEq={p.monthlyEquivalentFirstYear}
              note={t('result.hero.inclGst', { pct: CONFIG.gst.firstYear * 100 })}
            />
            <Column
              label={t('result.hero.renewal')}
              p={p}
              total={p.totalRenewal}
              monthlyEq={p.monthlyEquivalentRenewal}
              note={t('result.hero.inclGst', { pct: CONFIG.gst.renewal * 100 })}
              divider
            />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Column
              label={t('result.hero.premium')}
              p={p}
              total={p.totalRenewal}
              monthlyEq={p.monthlyEquivalentRenewal}
              note={t('result.hero.gstExempt')}
            />
            <div className="rounded-xl bg-white/10 px-3 py-2 sm:border-l sm:border-white/15 sm:bg-transparent sm:pl-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{t('invest.get')}</div>
              <div className="mt-1 text-2xl font-extrabold tabular tracking-tight text-gold-300 sm:text-3xl">
                {formatINR(result.maturity.totalBenefit)}
              </div>
              <div className="text-[11px] text-white/60">
                {t('invest.sa')} + {t('invest.bonus')}
                {result.bonus.terminal > 0 ? ` · +${formatINR(result.bonus.terminal)} ${t('result.terminalBonus').toLowerCase()}` : ''}
              </div>
            </div>
          </div>
        )}

        {result.premiumAfterConversion && (
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs">
            <span className="font-semibold text-gold-300">{t('result.hero.afterConversion')}:</span>{' '}
            <span className="tabular font-bold">{formatINR(result.premiumAfterConversion.totalRenewal, { decimals: true })}</span>{' '}
            <span className="text-white/70">{t(PER_KEY[p.mode])}</span>
          </div>
        )}
        <div className="mt-3 text-[11px] text-white/80">
          <span className="text-white/60">{t('input.sumAssured')}:</span> <span className="font-semibold text-white">{formatINR(result.maturity.sumAssured)}</span>
          <span className="text-white/70"> · {amountInWords(result.maturity.sumAssured, lang)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/80">
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
            {result.plan.joint
              ? t('result.maturityAgeJoint', { eff: Math.round((result.input.age + (result.input.spouseAge ?? result.input.age)) / 2) })
              : t('result.maturityAge')}
            : {result.maturityAge}
          </span>
        </div>
      </div>
    </section>
  )
}

import { forwardRef } from 'react'
import type { CalcResult } from '@/domain/engine.ts'
import { CONFIG } from '@/domain/config.ts'
import { amountInWords, formatINR, formatPct } from '@/domain/format.ts'
import type { Lang } from '@/domain/types.ts'
import { translate, type TranslationKey } from '@/i18n'
import { RATE_TABLE_META } from '@/domain/rates/index.ts'
import type { AgentProfile } from '@/features/agent/agent.ts'

interface Props {
  result: CalcResult
  lang: Lang
  customerName: string
  agent: AgentProfile
  quoteRef: string
}

/**
 * A4-proportioned quotation sheet rendered off-screen and rasterised by html2canvas.
 * Uses only inline-safe Tailwind classes (no gradients/filters that html2canvas mishandles).
 */
export const QuoteSheet = forwardRef<HTMLDivElement, Props>(function QuoteSheet(
  { result, lang, customerName, agent, quoteRef },
  ref,
) {
  const t = (k: TranslationKey, p?: Record<string, string | number>) => translate(lang, k, p)
  const plan = result.plan
  const p = result.premium
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const modeLabel = t(`mode.${p.mode}`)
  const gstApplies = CONFIG.gst.firstYear > 0 || CONFIG.gst.renewal > 0
  const gstExemptDate = new Date(CONFIG.gst.exemptFrom).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  // Keep the sheet to one A4 page: first five years, every fifth year, payout years and the final year.
  const lastYear = result.years[result.years.length - 1]?.year ?? 0
  const keyYear = (r: (typeof result.years)[number]) => r.inflow > 0 || r.year === lastYear || r.year === result.premiumTerm
  const every5 = result.years.filter((r) => r.year <= 5 || r.year % 5 === 0 || keyYear(r))
  // Long policies (whole life from a young age) would overflow the page: thin the table further.
  const yearRows = every5.length > 13 ? result.years.filter((r) => r.year <= 3 || r.year % 10 === 0 || keyYear(r)) : every5

  const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
    <tr className="border-b border-slate-100">
      <td className="whitespace-nowrap py-0.5 pr-3 text-[11px] text-slate-600">{k}</td>
      <td className={`py-0.5 text-right text-[11px] tabular ${bold ? 'font-bold text-slate-900' : 'text-slate-800'}`}>{v}</td>
    </tr>
  )

  return (
    <div ref={ref} className="flex min-h-[1123px] w-[794px] flex-col bg-white p-7 text-slate-900" style={{ fontFamily: 'Inter, "Noto Sans Devanagari", Arial, sans-serif' }}>
      {/* Header band */}
      <div className="flex items-center justify-between border-b-4 border-postal-600 pb-3">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}icons/emblem-192.png`} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
          <div>
            <div className="text-xl font-extrabold tracking-tight text-postal-700">{t('app.title')}</div>
            <div className="text-xs text-slate-500">{t(`product.${plan.product}.full`)} · India Post</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{t('pdf.title')}</div>
          <div className="text-xs text-slate-500">
            {t('pdf.date')}: {date} · {t('pdf.quoteNo')}: {quoteRef}
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mt-2 grid grid-cols-2 gap-6">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('pdf.for')}</div>
          <div className="text-base font-bold">{customerName.trim() || '________________________'}</div>
          <div className="text-xs text-slate-600">
            {t('pdf.lifeAssured')}: {result.input.age} {t('common.yrs')}
            {plan.joint ? ` · ${t('input.spouseAge')}: ${result.input.spouseAge}` : ''}
            {plan.kind === 'CHILD' ? ` · ${t('input.parentAge')}: ${result.input.parentAge}` : ''}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('agent.title')}</div>
          <div className="text-base font-bold">{agent.name || '—'}</div>
          <div className="text-xs text-slate-600">{[agent.designation, agent.office, agent.mobile].filter(Boolean).join(' · ') || '—'}</div>
        </div>
      </div>

      {/* Headline */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg border-2 border-postal-600 p-3">
          <div className="text-[10px] font-bold uppercase text-postal-700">
            {t('result.hero.title')}{gstApplies ? ` · ${t('result.hero.firstYear')}` : ''}
          </div>
          <div className="text-2xl font-extrabold tabular">{formatINR(p.totalFirstYear, { decimals: p.totalFirstYear % 1 !== 0 })}</div>
          <div className="text-[10px] text-slate-500">
            {modeLabel} · {gstApplies ? t('result.hero.inclGst', { pct: CONFIG.gst.firstYear * 100 }) : t('result.hero.gstExempt')}
          </div>
        </div>
        {gstApplies ? (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">{t('result.hero.renewal')}</div>
            <div className="text-2xl font-extrabold tabular">{formatINR(p.totalRenewal, { decimals: true })}</div>
            <div className="text-[10px] text-slate-500">
              {modeLabel} · {t('result.hero.inclGst', { pct: CONFIG.gst.renewal * 100 })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">{t('invest.pay')}</div>
            <div className="text-2xl font-extrabold tabular">{formatINR(result.totals.outgo)}</div>
            <div className="text-[10px] text-slate-500">
              {result.premiumTerm} {t('common.years')} · {t('result.gstExempt', { date: gstExemptDate })}
            </div>
          </div>
        )}
        <div className="rounded-lg bg-gold-100 p-3">
          <div className="text-[10px] font-bold uppercase text-gold-800">{t('invest.get')}</div>
          <div className="text-2xl font-extrabold tabular text-gold-900">{formatINR(result.maturity.totalBenefit)}</div>
          <div className="text-[10px] text-gold-800">
            {t('invest.irr')}: {result.returns.irr === null ? '—' : formatPct(result.returns.irr, 2)}
          </div>
        </div>
      </div>

      {/* Summary tables */}
      <div className="mt-3 grid grid-cols-2 gap-6">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-postal-700">{t('pdf.policySummary')}</div>
          <table className="w-full">
            <tbody>
              <Row k={t('plan.choose')} v={`${plan.name[lang]} (${plan.code})`} bold />
              <Row k={t('input.sumAssured')} v={formatINR(result.maturity.sumAssured)} bold />
              <Row k={t('result.saWords')} v={amountInWords(result.maturity.sumAssured, lang)} />
              <Row k={t('result.term')} v={`${result.term} ${t('common.years')}`} />
              <Row k={t('result.premiumTerm')} v={`${result.premiumTerm} ${t('common.years')}`} />
              <Row
                k={plan.joint ? t('result.maturityAgeJoint', { eff: Math.round((result.input.age + (result.input.spouseAge ?? result.input.age)) / 2) }) : t('result.maturityAge')}
                v={String(result.maturityAge)}
              />
              <Row k={t('input.paymentMode')} v={modeLabel} />
              <Row k={t('result.bonusRate')} v={t('result.bonusRateValue', { n: result.bonus.rate })} />
              <Row k={t('invest.bonus')} v={formatINR(result.bonus.total)} />
              {result.bonus.terminal > 0 && <Row k={t('result.terminalBonus').replace(/\s*\(.*\)$/, '')} v={formatINR(result.bonus.terminal)} />}
              <Row
                k={t('loan.title').replace(/\s*\(.*\)$/, '')}
                v={
                  result.plan.surrenderAfterYears === null
                    ? t('loan.noneChild')
                    : result.loan.eligibleAfterYears === null
                      ? t('loan.notAvailable')
                      : t('loan.eligibleAfter', { n: result.loan.eligibleAfterYears })
                }
              />
              <Row k={t('uw.title')} v={result.medical.required ? t('uw.medical') : t('uw.nonMedical')} />
            </tbody>
          </table>
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-postal-700">{t('pdf.premiumSummary')}</div>
          <table className="w-full">
            <tbody>
              <Row k={t('result.rate')} v={`₹${p.ratePer1000.toFixed(2)}`} />
              {p.ageProofLoading > 0 && <Row k={t('result.ageProofLoading', { pct: p.ageProofLoadingPct * 100 })} v={`+ ${formatINR(p.ageProofLoading)}`} />}
              <Row k={t('result.tabular')} v={formatINR(p.tabularMonthly)} />
              {p.mode !== 'monthly' && <Row k={t('result.tabularModal', { mode: modeLabel })} v={formatINR(p.tabularModal)} />}
              {p.saRebateModal > 0 && <Row k={p.mode === 'monthly' ? t('result.saRebate') : t('result.saRebateModal', { mode: modeLabel })} v={`− ${formatINR(p.saRebateModal)}`} />}
              <Row k={p.mode === 'monthly' ? t('result.netMonthly') : t('result.netModal', { mode: modeLabel })} v={formatINR(p.modal)} bold />
              {gstApplies ? (
                <>
                  <Row k={`${t('result.gst')} ${CONFIG.gst.firstYear * 100}%`} v={formatINR(p.gstFirstYear, { decimals: true })} />
                  <Row k={`${t('result.total')} – ${t('result.hero.firstYear')}`} v={formatINR(p.totalFirstYear, { decimals: true })} bold />
                  <Row k={`${t('result.gst')} ${CONFIG.gst.renewal * 100}%`} v={formatINR(p.gstRenewal, { decimals: true })} />
                  <Row k={`${t('result.total')} – ${t('result.hero.renewal')}`} v={formatINR(p.totalRenewal, { decimals: true })} bold />
                </>
              ) : (
                <>
                  <Row k={t('result.gst')} v="NIL" />
                  <Row k={t('result.total')} v={formatINR(p.totalRenewal, { decimals: p.totalRenewal % 1 !== 0 })} bold />
                </>
              )}
              {result.premiumAfterConversion && (
                <Row k={t('result.hero.afterConversion')} v={formatINR(result.premiumAfterConversion.totalRenewal, { decimals: true })} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashflow projection */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-postal-700">{t('pdf.cashflow')}</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-[10px] text-slate-500">{t('invest.pay')}</div>
            <div className="text-sm font-bold tabular">{formatINR(result.totals.outgo)}</div>
            <div className="text-[9px] text-slate-400">
              {gstApplies
                ? `${t('invest.premiums')} ${formatINR(result.totals.basePremiums)} + ${t('invest.gst')} ${formatINR(result.totals.gst)}`
                : `${result.premiumTerm} ${t('common.years')} · GST NIL`}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-[10px] text-slate-500">{t('invest.get')}</div>
            <div className="text-sm font-bold tabular">{formatINR(result.maturity.totalBenefit)}</div>
            <div className="text-[9px] text-slate-400">
              {t('invest.sa')} + {t('invest.bonus')}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-[10px] text-slate-500">{t('invest.gain')}</div>
            <div className="text-sm font-bold tabular text-emerald-700">{formatINR(result.maturity.netGain)}</div>
            <div className="text-[9px] text-slate-400">{t('invest.roi')} {formatPct(result.returns.roi, 0)}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-[10px] text-slate-500">{t('protection.title')}</div>
            <div className="text-sm font-bold tabular">{formatINR(result.maturity.sumAssured)}+</div>
            <div className="text-[9px] text-slate-400">{t('protection.today')}</div>
          </div>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px]">
          {result.milestones
            .filter((m) => m.amount > 0)
            .map((m, i) => (
              <li key={i} className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                <span>
                  {t('timeline.year', { n: m.year })} ({t('timeline.age', { n: m.age })}) ·{' '}
                  {m.kind === 'survival'
                    ? t('timeline.survival', { pct: m.pct ?? 0 })
                    : m.kind === 'premiumEnd'
                      ? t('timeline.premiumEnd')
                      : t('timeline.maturity')}
                </span>
                <span className="font-bold tabular">{formatINR(m.amount)}</span>
              </li>
            ))}
        </ul>
      </div>

      {/* Year-wise table */}
      <div className="mt-3">
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-postal-700">{t('pdf.yearTable')}</div>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-100 text-left text-[9px] uppercase text-slate-600">
              <th className="px-1.5 py-1">{t('table.year')}</th>
              <th className="px-1.5 py-1">{t('table.age')}</th>
              <th className="px-1.5 py-1 text-right">{t('table.premium')}</th>
              {gstApplies && <th className="px-1.5 py-1 text-right">{t('table.gst')}</th>}
              <th className="px-1.5 py-1 text-right">{t('table.total')}</th>
              <th className="px-1.5 py-1 text-right">{t('table.cumulative')}</th>
              <th className="px-1.5 py-1 text-right">{t('table.benefit')}</th>
              <th className="px-1.5 py-1 text-right">{t('table.cover')}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {yearRows.map((r) => (
              <tr key={r.year} className={`border-b border-slate-100 leading-tight ${r.inflow ? 'bg-gold-50' : ''}`}>
                <td className="px-1.5 py-0.5 font-semibold">{r.year}</td>
                <td className="px-1.5 py-0.5 text-slate-500">{r.age}</td>
                <td className="px-1.5 py-0.5 text-right">{r.base ? formatINR(r.base) : '—'}</td>
                {gstApplies && <td className="px-1.5 py-0.5 text-right text-slate-500">{r.gst ? formatINR(r.gst, { decimals: true }) : '—'}</td>}
                <td className="px-1.5 py-0.5 text-right font-semibold">{r.total ? formatINR(r.total, { decimals: true }) : '—'}</td>
                <td className="px-1.5 py-0.5 text-right text-slate-500">{formatINR(r.cumulative)}</td>
                <td className="px-1.5 py-0.5 text-right font-bold text-postal-700">{r.inflow ? formatINR(r.inflow) : '—'}</td>
                <td className="px-1.5 py-0.5 text-right text-slate-500">{formatINR(r.lifeCover)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures – pushed to the foot of the page */}
      <div className="mt-auto grid grid-cols-2 gap-12 pt-6">
        <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">{t('pdf.customerSign')}</div>
        <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">{t('pdf.agentSign')}</div>
      </div>

      <p className="mt-3 text-[9px] text-slate-600">{t('uw.tax')}</p>
      <p className="mt-2 text-[9px] leading-relaxed text-slate-500">
        <span className="font-semibold">{t('disclaimer.title')}: </span>
        {t('disclaimer.body', { date: RATE_TABLE_META.generatedAt })}
      </p>
      <p className="mt-1 text-center text-[9px] text-slate-400">
        {t('pdf.generatedBy')} · {t('app.developedBy')}: {t('app.developer')}
      </p>
    </div>
  )
})

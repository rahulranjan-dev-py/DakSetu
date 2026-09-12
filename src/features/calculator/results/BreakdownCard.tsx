import { Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatRow } from '@/components/ui/stat'
import type { CalcResult } from '@/domain/engine.ts'
import { CONFIG } from '@/domain/config.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

export function BreakdownCard({ result }: { result: CalcResult }) {
  const { t, lang } = useI18n()
  const p = result.premium
  const gstApplies = CONFIG.gst.firstYear > 0 || CONFIG.gst.renewal > 0
  const gstExemptDate = new Date(CONFIG.gst.exemptFrom).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Receipt size={14} /> {t('result.breakdown')}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-dashed divide-slate-100">
        <StatRow label={t('result.rate')} value={`₹${p.ratePer1000.toFixed(2)}`} />
        {p.ageProofLoading > 0 && (
          <StatRow label={t('result.ageProofLoading', { pct: p.ageProofLoadingPct * 100 })} value={`+ ${formatINR(p.ageProofLoading)}`} />
        )}
        {p.mode === 'monthly' ? (
          <>
            <StatRow label={t('result.tabular')} value={formatINR(p.tabularMonthly)} />
            {p.saRebate > 0 && <StatRow label={t('result.saRebate')} value={`− ${formatINR(p.saRebate)}`} />}
            <StatRow label={t('result.netMonthly')} value={formatINR(p.netMonthly)} emphasis />
          </>
        ) : (
          <>
            <StatRow label={t('result.tabular')} value={formatINR(p.tabularMonthly)} />
            <StatRow
              label={t('result.tabularModal', { mode: t(`mode.${p.mode}`).toLowerCase() })}
              sub={`× ${p.modeMultiplier}${p.modeRebatePct ? ` · ${(p.modeRebatePct * 100).toFixed(2)}%` : ''}`}
              value={formatINR(p.tabularModal)}
            />
            {p.saRebateModal > 0 && (
              <StatRow label={t('result.saRebateModal', { mode: t(`mode.${p.mode}`).toLowerCase() })} value={`− ${formatINR(p.saRebateModal)}`} />
            )}
            <StatRow label={t('result.netModal', { mode: t(`mode.${p.mode}`).toLowerCase() })} value={formatINR(p.modal)} emphasis />
          </>
        )}
        {gstApplies ? (
          <>
            <StatRow label={`${t('result.gst')} ${CONFIG.gst.firstYear * 100}% (${t('result.hero.firstYear')})`} value={formatINR(p.gstFirstYear, { decimals: true })} />
            <StatRow label={`${t('result.total')} (${t('result.hero.firstYear')})`} value={formatINR(p.totalFirstYear, { decimals: true })} emphasis />
            <StatRow label={`${t('result.gst')} ${CONFIG.gst.renewal * 100}% (${t('result.hero.renewal')})`} value={formatINR(p.gstRenewal, { decimals: true })} />
            <StatRow label={`${t('result.total')} (${t('result.hero.renewal')})`} value={formatINR(p.totalRenewal, { decimals: true })} emphasis />
          </>
        ) : (
          <>
            <StatRow label={t('result.total')} value={formatINR(p.totalRenewal, { decimals: p.totalRenewal % 1 !== 0 })} emphasis />
            <p className="pt-2 text-[11px] text-emerald-700">{t('result.gstExempt', { date: gstExemptDate })}</p>
          </>
        )}
        {result.bonus.terminal > 0 && (
          <StatRow label={t('result.terminalBonus')} sub={t('result.terminalBonusHint')} value={formatINR(result.bonus.terminal)} />
        )}
      </CardContent>
    </Card>
  )
}

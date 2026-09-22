import { Info } from 'lucide-react'
import { RATE_TABLE_META } from '@/domain/rates/index.ts'
import { useI18n } from '@/i18n'

export function Disclaimer({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={className ?? 'flex gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400'}>
      <Info size={14} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
      <p>
        <span className="font-semibold text-slate-600 dark:text-slate-400">{t('disclaimer.title')}: </span>
        {t('disclaimer.body', { date: RATE_TABLE_META.generatedAt })}
      </p>
    </div>
  )
}

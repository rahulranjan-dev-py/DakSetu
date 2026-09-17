import { AlertCircle } from 'lucide-react'
import type { ValidationIssue } from '@/domain/engine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

export function ErrorList({ issues }: { issues: ValidationIssue[] }) {
  const { t } = useI18n()
  if (!issues.length) return null
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
      <div className="mb-1 flex items-center gap-2 font-bold">
        <AlertCircle size={16} /> {t('error.fix')}
      </div>
      <ul className="list-disc space-y-0.5 pl-6">
        {issues.map((i, idx) => {
          const params: Record<string, string | number> = { ...(i.params ?? {}) }
          for (const k of ['min', 'max', 'step']) {
            if (typeof params[k] === 'number' && (params[k] as number) >= 1000 && i.code.startsWith('SA_')) params[k] = formatINR(params[k] as number)
          }
          return <li key={idx}>{t(`error.${i.code}`, params)}</li>
        })}
      </ul>
    </div>
  )
}
